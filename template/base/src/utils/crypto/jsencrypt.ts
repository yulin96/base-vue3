import JSEncrypt from 'jsencrypt'

/**
 * @example
 * 使用公钥创建加密实例
 * const encrypt = createEncryptIns('<publicKey>');
 * encrypt.encrypt('1231');
 */
export function createEncryptIns(publicKey: string): { encrypt: (str: string) => string | false }
/**
 * @example
 * // 使用公钥和私钥创建加密解密实例
 * const encrypt2 = createEncryptIns('<publicKey>', '<privateKey>');
 * encrypt2.encrypt('1231'); // 加密
 * encrypt2.decrypt('1231'); // 解密
 */
export function createEncryptIns(
  publicKey: string,
  privateKey?: string,
): { encrypt: (str: string) => string | false; decrypt: (str: string) => string | false }

export function createEncryptIns(publicKey: string, privateKey?: string) {
  const jsencrypt = new JSEncrypt()
  jsencrypt.setPublicKey(publicKey)
  if (privateKey) jsencrypt.setPrivateKey(privateKey)
  return {
    encrypt: (str: string) => {
      return jsencrypt.encrypt(str)
    },
    ...(privateKey
      ? {
          decrypt: (str: string) => {
            return jsencrypt.decrypt(str)
          },
        }
      : {}),
  }
}
