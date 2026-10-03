import type { ResData } from '@/api/types'
import { services } from '@/config/services'
import { useLockRequest } from '@/hooks/network/useLockRequest'

const { get: getMenus } = useLockRequest()
type MenuData = {
  title: string
  status: number
  url: string
  remark: string
}

export const apiMenus = async (title: string, url = services.menus.url): Promise<[boolean, MenuData | null]> => {
  try {
    const response = await getMenus<ResData<MenuData>>(url, { title })
    return [response.data?.status == 1, response.data ?? null]
  } catch {
    return [false, null]
  }
}
