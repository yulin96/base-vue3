import type { ResData } from '@/api/types'
import { services } from '@/config/services'
import { useLockRequest } from '@/hooks/network/useLockRequest'
import { useStore } from '@/stores/user'

const { post: postGetCode } = useLockRequest(false)
type OpenIdData = {
  openid: string
  nickname?: string
  avatar?: string
}
/**
 * 获取微信用户openid
 * @returns 是否获取成功
 */
export async function getOpenId(): Promise<boolean> {
  const { user } = useStore()
  if (user.wxInfo?.openid) return true

  const proid = new URLSearchParams(location.search).get('proid')
  if (!proid) return false

  try {
    const response = await postGetCode<ResData<OpenIdData>>(services.wechat.codeUrl, { proid })
    if (!response.data.openid) return false

    Object.assign(user.wxInfo, response.data)
    return true
  } catch {
    return false
  }
}
