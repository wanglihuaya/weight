const cloud = require('wx-server-sdk')

// 使用当前小程序关联的云环境，避免在源码中写死环境 ID。
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const command = db.command
const {
  buildSummary,
  normalizeRecord,
  resolveRecordDate,
  roundWeight,
} = require('./model')

const MAX_LIST_LIMIT = 500
const SUMMARY_BATCH_SIZE = 100
const MAX_SUMMARY_RECORDS = 5000
const MAX_NOTE_LENGTH = 200
const MAX_PHOTO_COUNT = 3

function normalizePhotoFileIds(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value
    .filter(fileId => typeof fileId === 'string')
    .map(fileId => fileId.trim())
    .filter(fileId => fileId.startsWith('cloud://') && fileId.length <= 512))]
    .slice(0, MAX_PHOTO_COUNT)
}

/**
 * 确保业务集合存在。
 * 云数据库在集合已存在时会抛出异常，此处将该异常视为幂等成功。
 *
 * @param {string} name 集合名称
 * @returns {Promise<void>}
 */
async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    // 集合通常已经存在，无需中断本次业务请求。
  }
}

/**
 * 创建一条当前用户的体重记录。
 * 会校验体重与记录时间，并通过 requestId 提供客户端重试所需的幂等能力。
 *
 * @param {object} event 云函数入参
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} weightRecords 体重记录集合
 * @returns {Promise<{record: object, duplicated?: boolean}>}
 */
async function createRecord(event, openid, weightRecords) {
  const weight = roundWeight(event.weight)
  if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
    throw new Error('INVALID_WEIGHT')
  }

  const recordedAt = new Date(event.recordedAt || Date.now())
  if (Number.isNaN(recordedAt.getTime())) {
    throw new Error('INVALID_RECORDED_AT')
  }

  const now = new Date().toISOString()
  const recordDate = resolveRecordDate(event.recordDate || recordedAt)
  const mode = ['now', 'photo', 'note'].includes(event.mode) ? event.mode : 'now'
  const note = typeof event.note === 'string' ? event.note.trim().slice(0, MAX_NOTE_LENGTH) : ''
  const photoFileIds = normalizePhotoFileIds(event.photoFileIds)
  const requestId = typeof event.requestId === 'string' ? event.requestId.trim().slice(0, 80) : ''

  if (requestId) {
    const existing = await weightRecords.where({ openid, requestId }).limit(1).get()
    if (existing.data[0]) {
      return {
        record: normalizeRecord(existing.data[0]),
        duplicated: true,
      }
    }
  }

  const created = await weightRecords.add({
    data: {
      openid,
      weight,
      recordDate,
      recordedAt: recordedAt.toISOString(),
      mode,
      note,
      photoFileIds,
      requestId,
      createdAt: now,
      updatedAt: now,
    },
  })

  return {
    record: normalizeRecord({
      _id: created._id,
      openid,
      weight,
      recordDate,
      recordedAt: recordedAt.toISOString(),
      mode,
      note,
      photoFileIds,
    }),
  }
}

/**
 * 查询当前用户的一条体重记录，用于详情页展示。
 *
 * @param {object} event 包含记录 id
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} weightRecords 体重记录集合
 * @returns {Promise<{record: object}>}
 */
async function getRecord(event, openid, weightRecords) {
  const id = typeof event.id === 'string' ? event.id.trim() : ''
  if (!id) {
    throw new Error('INVALID_RECORD_ID')
  }

  const response = await weightRecords.where({ _id: id, openid }).limit(1).get()
  const record = response.data?.[0]
  if (!record) {
    throw new Error('RECORD_NOT_FOUND')
  }

  return {
    record: normalizeRecord(record),
  }
}

/**
 * 分页查询当前用户的体重记录。
 * 支持按 recordDate 起止日期筛选，结果按记录时间倒序返回。
 *
 * @param {object} event 包含 limit、offset、startDate、endDate 的查询参数
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} weightRecords 体重记录集合
 * @returns {Promise<{records: object[], nextOffset: number, hasMore: boolean}>}
 */
async function listRecords(event, openid, weightRecords) {
  const limit = Math.max(1, Math.min(MAX_LIST_LIMIT, Number(event.limit) || 200))
  const offset = Math.max(0, Math.min(5000, Number(event.offset) || 0))
  const where = { openid }

  if (event.startDate || event.endDate) {
    if (event.startDate && event.endDate) {
      where.recordDate = command.and([
        command.gte(resolveRecordDate(event.startDate)),
        command.lte(resolveRecordDate(event.endDate)),
      ])
    }
    else if (event.startDate) {
      where.recordDate = command.gte(resolveRecordDate(event.startDate))
    }
    else if (event.endDate) {
      where.recordDate = command.lte(resolveRecordDate(event.endDate))
    }
  }

  const response = await weightRecords
    .where(where)
    .orderBy('recordedAt', 'desc')
    .skip(offset)
    .limit(limit)
    .get()

  return {
    records: (response.data || []).map(normalizeRecord),
    nextOffset: offset + (response.data || []).length,
    hasMore: (response.data || []).length === limit,
  }
}

/**
 * 分批读取当前用户用于汇总计算的全部记录。
 * 通过数量上限保护云函数，防止历史数据过多导致执行时间和内存失控。
 *
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} weightRecords 体重记录集合
 * @returns {Promise<object[]>}
 */
async function getAllRecords(openid, weightRecords) {
  const records = []

  while (records.length < MAX_SUMMARY_RECORDS) {
    const response = await weightRecords
      .where({ openid })
      .orderBy('recordedAt', 'asc')
      .skip(records.length)
      .limit(SUMMARY_BATCH_SIZE)
      .get()
    const batch = response.data || []
    records.push(...batch)

    if (batch.length < SUMMARY_BATCH_SIZE) {
      break
    }
  }

  return records
}

/**
 * 生成当前用户的连续记录、周/月变化和近期区间等统计摘要。
 *
 * @param {object} event 可选 referenceDate，用于按指定日期计算统计窗口
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} weightRecords 体重记录集合
 * @returns {Promise<{summary: object}>}
 */
async function summarizeRecords(event, openid, weightRecords) {
  const records = await getAllRecords(openid, weightRecords)
  return {
    summary: buildSummary(records, event.referenceDate || new Date().toISOString()),
  }
}

/**
 * 体重记录云函数入口。
 *
 * 支持的 action：
 * - create：新增记录
 * - get：查询单条记录
 * - list：分页查询记录
 * - summary：获取统计摘要
 *
 * 所有操作均通过云调用上下文中的 OPENID 隔离用户数据。
 *
 * @param {object} event 云函数调用参数
 * @returns {Promise<object>}
 */
exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    throw new Error('OPENID_NOT_FOUND')
  }

  await ensureCollection('weight_records')
  const weightRecords = db.collection('weight_records')

  if (event.action === 'create') {
    return createRecord(event, openid, weightRecords)
  }

  if (event.action === 'get') {
    return getRecord(event, openid, weightRecords)
  }

  if (event.action === 'list') {
    return listRecords(event, openid, weightRecords)
  }

  if (event.action === 'summary') {
    return summarizeRecords(event, openid, weightRecords)
  }

  throw new Error('UNKNOWN_ACTION')
}
