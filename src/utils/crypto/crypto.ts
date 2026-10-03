import { parseAesConfig } from '@/utils/crypto/aesConfig'
import CryptoJS from 'crypto-js'

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
