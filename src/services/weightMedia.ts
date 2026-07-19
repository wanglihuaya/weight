import { initCloudDevelopment } from './cloud'

export interface WeightPhotoSelection {
  tempFilePath: string
  size: number
}

function resolveFileExtension(filePath: string) {
  const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/)
  const extension = match?.[1]?.toLowerCase() ?? 'jpg'
  return /^[a-z0-9]{1,8}$/.test(extension) ? extension : 'jpg'
}

export function chooseWeightPhoto() {
  return new Promise<WeightPhotoSelection>((resolve, reject) => {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      camera: 'back',
      success(result) {
        const photo = result.tempFiles[0]
        if (!photo?.tempFilePath) {
          reject(new Error('未选择照片'))
          return
        }

        resolve({
          tempFilePath: photo.tempFilePath,
          size: Number(photo.size || 0),
        })
      },
      fail(error) {
        reject(error)
      },
    })
  })
}

export async function uploadWeightPhotos(filePaths: string[]) {
  if (filePaths.length === 0) {
    return []
  }

  if (!initCloudDevelopment() || !wx.cloud) {
    throw new Error('当前环境未启用微信云存储')
  }

  const uploadBatchId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const uploads = filePaths.slice(0, 3).map(async (filePath, index) => {
    const extension = resolveFileExtension(filePath)
    const result = await wx.cloud.uploadFile({
      cloudPath: `weight-records/${new Date().getFullYear()}/${uploadBatchId}-${index + 1}.${extension}`,
      filePath,
    })

    if (!result.fileID) {
      throw new Error('照片上传失败')
    }

    return result.fileID
  })

  return Promise.all(uploads)
}
