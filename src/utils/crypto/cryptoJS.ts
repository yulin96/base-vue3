import { parseAesConfig, validateAesKey } from '@/utils/crypto/aesConfig'
import cryptoJS from 'crypto-js'

export function dateMd5(date?: string) {
  return cryptoJS.MD5(date ?? Date()).toString()
}

export function createAesCrypto(key: string, iv: string) {
  const config = parseAesConfig(key, iv)

  const encrypt = (text: string | Record<string, unknown>) => {
    const textIsString = typeof text === 'string'
    const encrypted = cryptoJS.AES.encrypt(textIsString ? text : JSON.stringify(text), config.key, {
      iv: config.iv,
    }).toString()

    return encrypted
  }

  const decrypt = (text: string) => {
    const decrypted = cryptoJS.AES.decrypt(text, config.key, { iv: config.iv })

    return decrypted.toString(cryptoJS.enc.Utf8)
  }

  return { encrypt, decrypt }
}

export function createIvEncryption(secretKey?: string) {
  const resolvedSecretKey = secretKey ?? cryptoJS.lib.WordArray.random(16).toString()
  const key = cryptoJS.enc.Utf8.parse(resolvedSecretKey)
  validateAesKey(key, 'secretKey')

  const encrypt = (text: string | Record<string, unknown>) => {
    const textIsString = typeof text === 'string'

    const iv = cryptoJS.lib.WordArray.random(16)
    const encrypted = cryptoJS.AES.encrypt(textIsString ? text : JSON.stringify(text), key, { iv: iv })

    const result = iv.toString() + encrypted.toString()
    return result
  }

  const decrypt = (text: string) => {
    if (!/^[\da-f]{32}/i.test(text)) {
      throw new Error('密文缺少有效的 IV')
    }

    const iv = cryptoJS.enc.Hex.parse(text.substring(0, 32))
    const ciphertext = text.substring(32)

    const decrypted = cryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
    })
    return decrypted.toString(cryptoJS.enc.Utf8)
  }

  return { encrypt, decrypt, secretKey: resolvedSecretKey }
}
