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
  const regIdCard = /^[1-9]\d{5}[1-9]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
  if (!regIdCard.test(idCard)) return false

  const idCardWi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const idCardY = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]
  let idCardWiSum = 0

  for (let i = 0; i < 17; i++) {
    const weight = idCardWi[i]
    if (weight) {
      idCardWiSum += parseInt(idCard.substring(i, i + 1)) * weight
    }
  }

  const idCardMod = idCardWiSum % 11
  const idCardLast = idCard.substring(17)

  if (idCardMod === 2) {
    return idCardLast.toLowerCase() === 'x'
  }

  return idCardLast === String(idCardY[idCardMod])
}

/**
 * 判断当前页面是否使用 HTTPS 协议
 * @returns {boolean} - 如果是 HTTPS 协议则返回 true，否则返回 false
 */
export function isHttps(): boolean {
  return location.protocol === 'https:'
}

/**
 * 判断给定的数据是否为 FormData 对象
 * @param formData 要检查的数据
 * @returns 如果给定的数据是 FormData 对象，则返回 true；否则返回 false
 */
export function isFormData(formData: unknown): formData is FormData {
  return Object.prototype.toString.call(formData) === '[object FormData]'
}

export function isCanceledRequest(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as {
    name?: string
    code?: string
    message?: string
    __CANCEL__?: boolean
  }

  return (
    err.name === 'CanceledError' ||
    err.code === 'ERR_CANCELED' ||
    err.message === 'canceled' ||
    err.message === 'Request aborted' ||
    err.__CANCEL__ === true
  )
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
 * 判断文本是否包含中文字符
 * @param str 输入字符串
 * @returns {boolean} - 如果包含中文则返回 true，否则返回 false
 */
export function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str)
}
