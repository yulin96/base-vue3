import { isMobile } from '@/utils/browser/ua'

/**
 * 检查用户名是否仅包含字母和数字
 * @param str 字符串
 * @returns {boolean} - 如果是有效用户名则返回 true，否则返回 false
 */
export function isNickName(str: string): boolean {
  return /^[A-Za-z0-9]+$/.test(str)
}

/**
 * 检查字符串是否是有效的电子邮件地址
 * @param email 邮箱
 * @returns {boolean} - 如果是有效邮箱则返回 true，否则返回 false
 */
export function isEmail(email: string): boolean {
  // 使用更严格的电子邮件验证正则表达式
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
}

/**
 * 检查字符串是否是有效的中国大陆手机号
 * @param phone 手机号
 * @returns {boolean} - 如果是手机号则返回 true，否则返回 false
 */
export function isPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 检查字符串是否是有效的中国大陆身份证号
 * @param idCard 身份证号
 * @returns {boolean} - 如果是有效身份证号则返回 true，否则返回 false
 */
export function isIdCard(idCard: string): boolean {
  const regIdCard =
    /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/

  // 如果通过该验证，说明身份证格式正确，但准确性还需计算
  if (regIdCard.test(idCard)) {
    if (idCard.length === 18) {
      const idCardWi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2] // 将前17位加权因子保存在数组里
      const idCardY = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2] // 这是除以11后，可能产生的11位余数、验证码，也保存成数组
      let idCardWiSum = 0 // 用来保存前17位各自乖以加权因子后的总和

      for (let i = 0; i < 17; i++) {
        const weight = idCardWi[i]
        if (weight) {
          idCardWiSum += parseInt(idCard.substring(i, i + 1)) * weight
        }
      }

      const idCardMod = idCardWiSum % 11 // 计算出校验码所在数组的位置
      const idCardLast = idCard.substring(17) // 得到最后一位身份证号码

      // 如果等于2，则说明校验码是10，身份证号码最后一位应该是X
      if (idCardMod === 2) {
        return idCardLast.toLowerCase() === 'x'
      } else {
        // 用计算出的验证码与最后一位身份证号码匹配，如果一致，说明通过，否则是无效的身份证号码
        return idCardLast === String(idCardY[idCardMod])
      }
    }
  }

  return false
}

/**
 * 判断当前页面是否使用 HTTPS 协议
 * @returns {boolean} - 如果是 HTTPS 协议则返回 true，否则返回 false
 */
export function isHttps(): boolean {
  return location.protocol === 'https:'
}

/**
 * 判断当前系统是否开启了深色模式
 * @type {boolean} - 如果开启了深色模式则为 true，否则为 false
 */
export const isDarkMode: boolean = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

/**
 * 监听深色模式变化
 * @param callback 回调函数，当深色模式变化时触发
 * @returns 取消监听的函数
 */
export function watchDarkMode(callback: (isDark: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const listener = (e: MediaQueryListEvent) => {
    callback(e.matches)
  }

  mediaQuery.addEventListener('change', listener)

  // 返回取消监听的函数
  return () => mediaQuery.removeEventListener('change', listener)
}

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

/**
 * 判断给定的数据是否为 FormData 对象
 * @param formData 要检查的数据
 * @returns 如果给定的数据是 FormData 对象，则返回 true；否则返回 false
 */
export function isFormData(formData: unknown): formData is FormData {
  return Object.prototype.toString.call(formData) === '[object FormData]'
}

/**
 * 判断字符串是否为有效的 URL
 */
export function isUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

/**
 * 判断是否展示PC模式
 */
export function isPcMode() {
  return !isMobile() || innerWidth > 700
}

/**
 * 判断文本是否包含中文字符
 * @param str 输入字符串
 * @returns {boolean} - 如果包含中文则返回 true，否则返回 false
 */
export function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str)
}
