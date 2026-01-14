import type { ResData } from '@/api/types'
import { toUrl } from '@/config/urls'
import { useLockRequest } from '@/hooks/useLockRequest'
import { replaceTo } from '@/plugins/replaceTo'
import { infoToast } from '@/plugins/vant/toast'
import { isUrl } from '@/utils/validate'
import type { RouteNamedMap } from 'vue-router/auto-routes'

const { get: getMenus } = useLockRequest()
export const apiMenus = (title: string) => {
  type T = {
    title: string
    status: number
    url: string
    remark: string
  }
  return new Promise<[boolean, T | null]>((resolve) => {
    getMenus<ResData<T>>('https://cdeapi.event1.cn/api/cmenu', { title })
      .then((res) => {
        resolve([res.data?.status == 1, res.data])
      })
      .catch(() => {
        resolve([false, null])
      })
  })
}

export async function replaceToWithMenus(name: string, path?: keyof RouteNamedMap) {
  const pathIsUndefined = path === undefined
  const pathIsUrl = pathIsUndefined ? false : isUrl(String(path))

  const [status, res] = await apiMenus(name)
  if (!status) return infoToast('敬请期待')

  if (!pathIsUndefined) {
    if (!pathIsUrl) replaceTo({ name: path })
    else toUrl(String(path))

    return
  }

  if (!res?.url || !isUrl(res?.url)) return infoToast('敬请期待！')
  toUrl(res.url)
}
