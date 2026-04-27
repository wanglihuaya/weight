const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const command = db.command

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    // collection already exists, ignore
  }
}

function roundWeight(value) {
  return Math.round(Number(value) * 10) / 10
}

function normalizeRecord(record) {
  return {
    _id: record._id,
    weight: roundWeight(record.weight),
    recordDate: record.recordDate,
    recordedAt: record.recordedAt,
    mode: record.mode || 'now',
    note: record.note || '',
  }
}

function resolveRecordDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value || Date.now())
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_RECORD_DATE')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
  const note = typeof event.note === 'string' ? event.note.trim().slice(0, 120) : ''

  const created = await weightRecords.add({
    data: {
      openid,
      weight,
      recordDate,
      recordedAt: recordedAt.toISOString(),
      mode,
      note,
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
    }),
  }
}

async function listRecords(event, openid, weightRecords) {
  const limit = Math.max(1, Math.min(500, Number(event.limit) || 200))
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
    .limit(limit)
    .get()

  return {
    records: (response.data || []).map(normalizeRecord),
  }
}

exports.main = async (event) => {
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

  if (event.action === 'list') {
    return listRecords(event, openid, weightRecords)
  }

  throw new Error('UNKNOWN_ACTION')
}
