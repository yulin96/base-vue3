import { devModel } from '@/config/env'
import { createEncryptIns } from '@/utils/crypto/jsencrypt'
import { enc, HmacSHA256 } from 'crypto-js'

type Dict = Record<string, unknown>

const APPID = import.meta.env.VITE_APP_APPID
const APPSECRET = import.meta.env.VITE_APP_APPSECRET

export const isPostEncryptEnabled = Boolean(APPID && APPSECRET)

const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuRr8rGHkpOmQ2OVhkDXb
8LAfkuhI+RZ9XMkgdlRBik4DMRy7EakW2qN7/GDstNkphmY2n5xp21Q2IwtzCsCI
H5bBK5K87QWwqm7xi1eDQ8LOp852ABCYanNr6ZmVUlSs0Ydo+FlagR2Ep7vyjjwm
zdsCyXHHI7YHwhufZabxQ1trYpaG51D2lEkWbIrWybQTpDdyQscmrWO9/WxyMnsm
p92mhDTGxPMrBVhODpxqyMi7Y48AgjaiiYTMq9M6R/aQlPlerGUvllgd++eICp3u
iaoVsfoNIKW4kXnRJmNkQ8w2ng8WkAKvu/OOKzMMoaVt+xEyDe+i13vWgDM6kZtw
mQIDAQAB
-----END PUBLIC KEY-----`

const encryptIns = createEncryptIns(rsaPublicKey)
export function createApiSignature(data: Dict, action: string) {
  const timestamp = Date.now().toString()
  const nonce = Math.random().toString(36).substring(2, 15)

  const payload = JSON.stringify({ ...data, action })
  const payloadEncoded = encodeURIComponent(payload)

  const query =
    payloadEncoded.length > 180
      ? Array.from({ length: Math.ceil(payloadEncoded.length / 180) }, (_, index) =>
          encryptIns.encrypt(payloadEncoded.slice(index * 180, (index + 1) * 180)),
        ).join('|')
      : encryptIns.encrypt(payloadEncoded)

  devModel && console.log(payload)
  devModel && console.log(payloadEncoded)
  devModel && console.log(query)

  return {
    query,
    headers: {
      appid: APPID,
      timestamp,
      noncestr: nonce,
      sign: HmacSHA256(`${APPID}${timestamp}${nonce}${action}`, APPSECRET).toString(enc.Hex),
    },
  }
}
