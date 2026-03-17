/**
 * 获取 crypto 对象，支持 SSR 安全
 */
function getCrypto(): Crypto | undefined {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto
  }
  if (typeof crypto !== 'undefined') {
    return crypto
  }
  return undefined
}

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

  const range = max - min + 1
  const cryptoObj = getCrypto()

  if (cryptoObj) {
    const array = new Uint32Array(1)
    cryptoObj.getRandomValues(array)
    return (array[0] % range) + min
  }

  // 回退到 Math.random() (仅当 Web Crypto 不可用时)
  return Math.floor(Math.random() * range) + min
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
  const cryptoObj = getCrypto()

  let randomChars = ''
  if (cryptoObj) {
    const array = new Uint32Array(len)
    cryptoObj.getRandomValues(array)
    randomChars = Array.from(array, (val) => seed[val % seed.length]).join('')
  } else {
    randomChars = Array.from({ length: len }, () => seed[Math.floor(Math.random() * seed.length)]).join('')
  }

  return `${prefix}_${timestamp}_${randomChars}`
}

/**
 * 生成一个随机的十六进制颜色值
 * @returns 一个随机的十六进制颜色值，格式为 "#RRGGBB"
 */
export function randomHex(): string {
  const cryptoObj = getCrypto()
  let randomVal: number

  if (cryptoObj) {
    const array = new Uint32Array(1)
    cryptoObj.getRandomValues(array)
    randomVal = array[0] & 0xffffff
  } else {
    randomVal = Math.floor(Math.random() * 0xffffff)
  }

  return `#${randomVal.toString(16).padStart(6, '0')}`
}
