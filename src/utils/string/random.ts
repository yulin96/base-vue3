/**
 * 生成指定范围内的随机数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @returns 生成的随机数
 */
export function randomNum(min: number, max?: number): number {
  if (max === undefined) {
    max = min
    min = 0
  }
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new TypeError('参数必须是数字类型')
  }

  if (min > max) {
    ;[min, max] = [max, min]
  }

  const randomValue = Math.floor(Math.random() * (max - min + 1)) + min
  return randomValue
}

/**
 * 生成随机名称
 * @param prefix 前缀，默认为 'z'
 * @param len 随机部分的长度，默认为 16
 * @returns 生成的随机名称
 */
export function randomString(prefix = 'z', len = 16): string {
  const seed = 'abcdefghijklmnopqrstuvwxyz1234567890'
  const timestamp = new Date().getTime()
  const randomChars = Array.from({ length: len }, () => seed[Math.floor(Math.random() * seed.length)]).join('')

  return `${prefix}_${timestamp}_${randomChars}`
}

/**
 * 生成一个随机的 UUID v4 字符串
 * @returns 生成的 UUID 字符串
 */
export function uuid(): string {
  // 如果可用，使用Web Crypto API
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }

  // 回退到手动实现
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 生成一个随机的十六进制颜色值
 * @returns 一个随机的十六进制颜色值，格式为 "#RRGGBB"
 */
export function randomHex(): string {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`
}
