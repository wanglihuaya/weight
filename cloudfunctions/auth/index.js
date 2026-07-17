const cloud = require('wx-server-sdk')

// 始终跟随当前小程序关联的云环境。
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

/**
 * 确保用户集合存在；集合已存在时保持幂等，不影响登录流程。
 *
 * @param {string} name 集合名称
 * @returns {Promise<void>}
 */
async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    // 集合通常已经存在，无需中断本次登录。
  }
}

/**
 * 生成返回给小程序端的用户结构。
 * 已有用户保留首次创建时间，同时将本次调用时间作为最近登录时间。
 *
 * @param {object|undefined} record 数据库中的用户记录
 * @param {string} fallbackOpenid 云调用上下文中的 OPENID
 * @param {string} now 当前 ISO 时间
 * @returns {object}
 */
function toUserPayload(record, fallbackOpenid, now) {
  return {
    _id: record?._id,
    openid: record?.openid || fallbackOpenid,
    createdAt: record?.createdAt || now,
    lastLoginAt: now,
  }
}

/**
 * 用户认证云函数入口。
 * 根据 OPENID 查找或创建用户，并在每次调用时更新最近登录时间。
 *
 * @returns {Promise<{user: object}>}
 */
exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    throw new Error('OPENID_NOT_FOUND')
  }

  await ensureCollection('users')

  const users = db.collection('users')
  const now = new Date().toISOString()
  const existing = await users.where({ openid }).limit(1).get()
  const currentUser = existing.data[0]

  if (currentUser) {
    await users.doc(currentUser._id).update({
      data: {
        lastLoginAt: now,
        updatedAt: now,
      },
    })

    return {
      user: toUserPayload(currentUser, openid, now),
    }
  }

  const createResult = await users.add({
    data: {
      openid,
      createdAt: now,
      lastLoginAt: now,
      updatedAt: now,
    },
  })

  return {
    user: {
      _id: createResult._id,
      openid,
      createdAt: now,
      lastLoginAt: now,
    },
  }
}
