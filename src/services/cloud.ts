const CLOUD_ENV_ID = "cloud1-d3gcntpep1716cda0";

let cloudInitialized = false
let cloudWarningShown = false

function getCloud() {
  return typeof wx !== 'undefined' ? wx.cloud : undefined
}

export function initCloudDevelopment() {
  const cloud = getCloud()
  if (!cloud) {
    if (!cloudWarningShown) {
      cloudWarningShown = true
      console.warn('wx.cloud 不可用，请确认基础库与云开发能力已开启')
    }
    return false
  }

  if (cloudInitialized) {
    return true
  }

  const initOptions: Record<string, unknown> = {
    traceUser: true,
  }
  const dynamicEnv = (cloud as typeof cloud & { DYNAMIC_CURRENT_ENV?: string }).DYNAMIC_CURRENT_ENV
  const env = CLOUD_ENV_ID || dynamicEnv
  if (env) {
    initOptions.env = env
  }

  cloud.init(initOptions as WechatMiniprogram.IAnyObject)
  cloudInitialized = true
  return true
}

export async function callCloudFunction<T>(name: string, data?: WechatMiniprogram.IAnyObject) {
  const cloud = getCloud()
  if (!initCloudDevelopment() || !cloud) {
    throw new Error('当前环境未启用微信云开发')
  }

  const response = await cloud.callFunction({
    name,
    data,
  })

  return (response.result ?? {}) as T
}
