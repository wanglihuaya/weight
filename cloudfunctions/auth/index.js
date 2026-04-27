const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    // collection already exists, ignore
  }
}

function toUserPayload(record, fallbackOpenid, now) {
  return {
    _id: record?._id,
    openid: record?.openid || fallbackOpenid,
    createdAt: record?.createdAt || now,
    lastLoginAt: now,
  }
}

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
