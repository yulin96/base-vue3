/**
 * 检查设备是否有摄像头
 * @returns {Promise<boolean>} - 如果设备有摄像头则返回 true，否则返回 false
 */
export async function hasCamera(): Promise<boolean> {
  if (!navigator.mediaDevices?.enumerateDevices) return false

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((device) => device.kind === 'videoinput')
  } catch {
    return false
  }
}

/**
 * 检查浏览器是否支持 WebP 图片格式
 * @returns {Promise<boolean>} - 如果支持则返回 true，否则返回 false
 */
export function supportsWebp(): Promise<boolean> {
  if ('_webpSupport' in window) {
    return Promise.resolve(window._webpSupport ?? false)
  }

  return new Promise((resolve) => {
    const webpTestImage = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
    const img = new Image()

    img.onload = function () {
      const result = img.width > 0 && img.height > 0
      window._webpSupport = result
      resolve(result)
    }

    img.onerror = function () {
      window._webpSupport = false
      resolve(false)
    }

    img.src = webpTestImage
  })
}
