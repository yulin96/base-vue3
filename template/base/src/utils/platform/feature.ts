/**
 * 检查设备是否有摄像头
 * @returns {Promise<boolean>} - 如果设备有摄像头则返回 true，否则返回 false
 */
export function hasCamera(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      resolve(false)
      return
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const hasVideoInput = devices.some((device) => device.kind === 'videoinput')
        resolve(hasVideoInput)
      })
      .catch(() => {
        resolve(false)
      })
  })
}

/**
 * 检查浏览器是否支持 WebP 图片格式
 * @returns {Promise<boolean>} - 如果支持则返回 true，否则返回 false
 */
export function supportsWebp(): Promise<boolean> {
  if ('_webpSupport' in window) {
    return Promise.resolve((window as any)._webpSupport)
  }

  return new Promise((resolve) => {
    const webpTestImage = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
    const img = new Image()

    img.onload = function () {
      const result = img.width > 0 && img.height > 0
      ;(window as any)._webpSupport = result
      resolve(result)
    }

    img.onerror = function () {
      ;(window as any)._webpSupport = false
      resolve(false)
    }

    img.src = webpTestImage
  })
}
