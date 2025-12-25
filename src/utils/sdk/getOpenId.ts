import { useLockRequest } from '@/hooks/useLockRequest'
import { useStore } from '@/stores/user'
import { useUrlSearchParams } from '@vueuse/core'

const { post: postGetCode } = useLockRequest(false)
/**
 * 获取微信用户openid
 * @param name 平台名称
 * @returns 是否获取成功
 */
export function getOpenId(): Promise<boolean | void> {
  return new Promise<boolean>((resolve) => {
    const { user } = useStore()
    if (user.wxInfo?.openid) return resolve(true)
    const params = useUrlSearchParams()
    const proid = params?.proid
    if (proid) {
      postGetCode('https://wechat.event1.cn/api/getCode', { proid })
        .then((res: Record<string, any>) => {
          if (!res.data?.openid) return resolve(false)
          Object.assign(user.wxInfo, res.data)
          resolve(true)
        })
        .catch(() => {
          resolve(false)
        })
    } else {
      resolve(false)
    }
  })
}
