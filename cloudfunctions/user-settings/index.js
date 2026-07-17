const cloud = require('wx-server-sdk')
const {
  DEFAULT_SETTINGS,
  normalizePatch,
  toSettings,
} = require('./model')

// 使用当前小程序关联的云环境，部署到不同环境时无需修改源码。
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 确保用户设置集合存在；集合已存在时忽略创建异常。
 *
 * @param {string} name 集合名称
 * @returns {Promise<void>}
 */
async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  }
  catch (error) {
    // 集合通常已经存在，无需中断本次设置请求。
  }
}

/**
 * 查询当前用户唯一的设置记录。
 *
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} settingsCollection 用户设置集合
 * @returns {Promise<object|undefined>}
 */
async function findSettings(openid, settingsCollection) {
  const response = await settingsCollection.where({ openid }).limit(1).get()
  return response.data[0]
}

/**
 * 获取当前用户设置；尚未保存过设置时返回默认配置。
 *
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} settingsCollection 用户设置集合
 * @returns {Promise<{settings: object}>}
 */
async function getSettings(openid, settingsCollection) {
  const current = await findSettings(openid, settingsCollection)
  return {
    settings: toSettings(current),
  }
}

/**
 * 校验并更新当前用户设置。
 * 首次更新会创建包含默认值的完整记录，后续更新仅写入允许的字段。
 *
 * @param {object} event 包含 settings 补丁的云函数入参
 * @param {string} openid 当前用户 OPENID
 * @param {DB.Collection} settingsCollection 用户设置集合
 * @returns {Promise<{settings: object}>}
 */
async function updateSettings(event, openid, settingsCollection) {
  const patch = normalizePatch(event.settings || {})
  const current = await findSettings(openid, settingsCollection)
  const now = new Date().toISOString()

  if (current) {
    await settingsCollection.doc(current._id).update({
      data: {
        ...patch,
        updatedAt: now,
      },
    })
  }
  else {
    await settingsCollection.add({
      data: {
        openid,
        ...DEFAULT_SETTINGS,
        ...patch,
        createdAt: now,
        updatedAt: now,
      },
    })
  }

  return {
    settings: toSettings({
      ...current,
      ...patch,
    }),
  }
}

/**
 * 用户设置云函数入口。
 *
 * 支持的 action：
 * - get：读取设置
 * - update：校验并更新设置
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

  await ensureCollection('user_settings')
  const settingsCollection = db.collection('user_settings')

  if (event.action === 'get') {
    return getSettings(openid, settingsCollection)
  }

  if (event.action === 'update') {
    return updateSettings(event, openid, settingsCollection)
  }

  throw new Error('UNKNOWN_ACTION')
}
