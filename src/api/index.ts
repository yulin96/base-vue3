import type { ResData } from '@/api/types'
import { useLockRequest } from '@/hooks/network/useLockRequest'
import { replaceTo } from '@/router'
import { toUrl } from '@/utils/navigation'
import { isUrl } from '@/utils/validate'
import type { RouteNamedMap } from 'vue-router/auto-routes'
import { toast } from 'vue-sonner'

const { get: getMenus } = useLockRequest()
type MenuData = {
  title: string
  status: number
  url: string
  remark: string
}

export const apiMenus = async (
  title: string,
  url = 'https://cdeapi.event1.cn/api/cmenu',
): Promise<[boolean, MenuData | null]> => {
  try {
    const response = await getMenus<ResData<MenuData>>(url, { title })
    return [response.data?.status == 1, response.data ?? null]
  } catch {
    return [false, null]
  }
}

export async function replaceToWithMenus(name: string, path?: () => void | keyof RouteNamedMap | (string & {})) {
  const [status, res] = await apiMenus(name)
  if (!status) return toast.info('敬请期待')

  const url = path || res?.url || ''

  if (!url) return toast.info('敬请期待!')

  if (typeof url === 'function') return url?.()
  if (isUrl(url)) return toUrl(url)
  replaceTo(url)
}
