import { enc, HmacSHA256 } from 'crypto-js'

type Dict = Record<string, unknown>

const APPID = import.meta.env.VITE_APP_APPID
const APPSECRET = import.meta.env.VITE_APP_APPSECRET

export const isPostEncryptEnabled = Boolean(APPID && APPSECRET)

export function createApiSignature(data: Dict, action: string) {
  const timestamp = Date.now().toString()
  const nonce = Math.random().toString(36).substring(2, 15)

  return {
    query: encodeURIComponent(JSON.stringify({ ...data, action })),
    headers: {
      appid: APPID,
      timestamp,
      noncestr: nonce,
      sign: HmacSHA256(`${APPID}${timestamp}${nonce}${action}`, APPSECRET).toString(enc.Hex),
    },
  }
}
