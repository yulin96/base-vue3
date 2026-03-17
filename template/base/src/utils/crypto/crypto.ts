import CryptoJS from 'crypto-js'

export function encrypt(text: string, keyStr: string, ivStr: string) {
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const iv = CryptoJS.enc.Utf8.parse(ivStr)
  const encrypted = CryptoJS.AES.encrypt(text, key, { iv }).toString()
  return encrypted
}

export function decrypt(text: string, keyStr: string, ivStr: string) {
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const iv = CryptoJS.enc.Utf8.parse(ivStr)
  try {
    const decrypted = JSON.parse(CryptoJS.AES.decrypt(text, key, { iv }).toString(CryptoJS.enc.Utf8))
    return decrypted
  } catch (error) {
    return null
  }
}
