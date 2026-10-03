import CryptoJS from 'crypto-js'

export function validateAesKey(key: CryptoJS.lib.WordArray, field: 'key' | 'secretKey' = 'key') {
  if (![16, 24, 32].includes(key.sigBytes)) {
    throw new RangeError(`AES ${field} 必须是 16、24 或 32 字节`)
  }
}

export function parseAesConfig(keyStr: string, ivStr: string) {
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const iv = CryptoJS.enc.Utf8.parse(ivStr)

  validateAesKey(key)
  if (iv.sigBytes !== 16) {
    throw new RangeError('AES iv 必须是 16 字节')
  }

  return { key, iv }
}
