import cryptoJS from 'crypto-js'

export function dateMd5(date?: string) {
  return cryptoJS.MD5(date ?? Date()).toString()
}

function parseAesConfig(key: string, iv: string) {
  const parsedKey = cryptoJS.enc.Utf8.parse(key)
  const parsedIv = cryptoJS.enc.Utf8.parse(iv)

  if (![16, 24, 32].includes(parsedKey.sigBytes)) {
    throw new RangeError('AES key 必须是 16、24 或 32 字节')
  }
  if (parsedIv.sigBytes !== 16) {
    throw new RangeError('AES iv 必须是 16 字节')
  }

  return { key: parsedKey, iv: parsedIv }
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
  if (![16, 24, 32].includes(key.sigBytes)) {
    throw new RangeError('AES secretKey 必须是 16、24 或 32 字节')
  }

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
