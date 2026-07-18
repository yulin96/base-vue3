import type { ResData } from '@/api/types'
import { useLockRequest } from '@/hooks/network/useLockRequest'
import { useStore } from '@/stores/user'
import { useUrlSearchParams } from '@vueuse/core'

const { post: postGetCode } = useLockRequest(false)
type OpenIdData = {
  openid: string
  nickname?: string
  avatar?: string
}
/**
 * 获取微信用户openid
 * @param name 平台名称
 * @returns 是否获取成功
 */
export async function getOpenId(): Promise<boolean> {
  const { user } = useStore()
  if (user.wxInfo?.openid) return true

  const params = useUrlSearchParams()
  const proid = params.proid
  if (!proid) return false

  try {
    const response = await postGetCode<ResData<OpenIdData>>('https://wechat.event1.cn/api/getCode', { proid })
    if (!response.data.openid) return false

    Object.assign(user.wxInfo, response.data)
    return true
  } catch {
    return false
  }
}
