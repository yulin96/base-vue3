import cryptoJS from 'crypto-js'

export function dateMd5(date?: string) {
  return cryptoJS.MD5(date ?? Date()).toString()
}

export function createAesCrypto(key?: string, iv?: string) {
  const _key = cryptoJS.enc.Utf8.parse(key || '91a48a8af7e580d8401514c01e2dda22')
  const _iv = cryptoJS.enc.Utf8.parse(iv || 'f7e580d8401514c0')

  const encrypt = (text: string | Record<string, any>) => {
    const textIsString = typeof text === 'string'
    const encrypted = cryptoJS.AES.encrypt(textIsString ? text : JSON.stringify(text), _key, {
      iv: _iv,
    }).toString()

    return encrypted
  }

  const decrypt = (text: string) => {
    const decrypted = cryptoJS.AES.decrypt(text, _key, { iv: _iv })

    return decrypted.toString(cryptoJS.enc.Utf8)
  }

  return { encrypt, decrypt }
}

export function createIvEncryption(secretKey?: string) {
  const _secretKey = secretKey || cryptoJS.lib.WordArray.random(32).toString()

  const encrypt = (text: string | Record<string, any>) => {
    const textIsString = typeof text === 'string'

    const iv = cryptoJS.lib.WordArray.random(16)
    const encrypted = cryptoJS.AES.encrypt(
      textIsString ? text : JSON.stringify(text),
      cryptoJS.enc.Utf8.parse(_secretKey),
      { iv: iv },
    )

    const result = iv.toString() + encrypted.toString()
    return result
  }

  const decrypt = (text: string) => {
    const iv = cryptoJS.enc.Hex.parse(text.substring(0, 32))
    const ciphertext = text.substring(32)

    const decrypted = cryptoJS.AES.decrypt(ciphertext, cryptoJS.enc.Utf8.parse(_secretKey), {
      iv: iv,
    })
    return decrypted.toString(cryptoJS.enc.Utf8)
  }

  return { encrypt, decrypt }
}
