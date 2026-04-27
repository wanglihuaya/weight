import { ref } from 'wevu'

import { callCloudFunction, initCloudDevelopment } from './cloud'

export interface CloudUserProfile {
  _id?: string
  openid: string
  createdAt: string
  lastLoginAt: string
}

const USER_CACHE_KEY = 'weight.cloud.user'

export const cloudUser = ref<CloudUserProfile | null>(readCachedUser())
export const cloudLoginReady = ref(!!cloudUser.value)
export const cloudLoginPending = ref(false)
export const cloudLoginError = ref('')

let loginPromise: Promise<CloudUserProfile | null> | null = null

function readCachedUser() {
  if (typeof wx === 'undefined') {
    return null
  }

  try {
    return wx.getStorageSync(USER_CACHE_KEY) as CloudUserProfile || null
  }
  catch {
    return null
  }
}

function cacheUser(user: CloudUserProfile | null) {
  if (typeof wx === 'undefined') {
    return
  }

  try {
    if (user) {
      wx.setStorageSync(USER_CACHE_KEY, user)
    }
    else {
      wx.removeStorageSync(USER_CACHE_KEY)
    }
  }
  catch {
    console.warn('缓存云用户信息失败')
  }
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return '无感登录失败'
}

export async function ensureSilentLogin(force = false) {
  initCloudDevelopment()

  if (!force && cloudUser.value) {
    cloudLoginReady.value = true
    return cloudUser.value
  }

  if (!force && loginPromise) {
    return loginPromise
  }

  loginPromise = (async () => {
    cloudLoginPending.value = true
    cloudLoginError.value = ''

    try {
      const result = await callCloudFunction<{ user?: CloudUserProfile }>('auth', { action: 'login' })
      cloudUser.value = result.user ?? null
      cacheUser(cloudUser.value)
      cloudLoginReady.value = !!cloudUser.value
      return cloudUser.value
    }
    catch (error) {
      cloudLoginReady.value = false
      cloudLoginError.value = resolveErrorMessage(error)
      throw error
    }
    finally {
      cloudLoginPending.value = false
      loginPromise = null
    }
  })()

  return loginPromise
}
