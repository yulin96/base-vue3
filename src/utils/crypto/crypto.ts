import CryptoJS from 'crypto-js'

function parseAesConfig(keyStr: string, ivStr: string) {
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const iv = CryptoJS.enc.Utf8.parse(ivStr)

  if (![16, 24, 32].includes(key.sigBytes)) {
    throw new RangeError('AES key 必须是 16、24 或 32 字节')
  }
  if (iv.sigBytes !== 16) {
    throw new RangeError('AES iv 必须是 16 字节')
  }

  return { key, iv }
}

export function encrypt(text: string, keyStr: string, ivStr: string) {
  const { key, iv } = parseAesConfig(keyStr, ivStr)
  const encrypted = CryptoJS.AES.encrypt(text, key, { iv }).toString()
  return encrypted
}

export function decrypt<T = unknown>(text: string, keyStr: string, ivStr: string): T | string | null {
  const { key, iv } = parseAesConfig(keyStr, ivStr)
  try {
    const decrypted = CryptoJS.AES.decrypt(text, key, { iv }).toString(CryptoJS.enc.Utf8)
    if (!decrypted) return null

    try {
      return JSON.parse(decrypted) as T
    } catch {
      return decrypted
    }
  } catch {
    return null
  }
}
