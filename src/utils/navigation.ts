import { apiMenus } from '@/api'
import { replaceTo, type RouterNameOrPath } from '@/router'
import { isUrl } from '@/utils/validate'
import { toast } from 'vue-sonner'

/**
 * 跳转到指定页面
 * @param url - 目标URL
 * @param options - 跳转选项
 */
export function toUrl(url: string, options: { newTab?: boolean; replace?: boolean } = {}): void {
  const { newTab = false, replace = false } = options

  try {
    if (newTab) {
      window.open(url, '_blank')
    } else if (replace) {
      window.location.replace(url)
    } else {
      window.location.href = url
    }
  } catch (e) {
    console.error('页面导航失败:', e)
  }
}

export async function replaceToWithMenus(name: string, path?: (() => void) | RouterNameOrPath) {
  const [status, res] = await apiMenus(name)
  if (!status) return toast.info('敬请期待')

  const url = path || res?.url || ''
  if (!url) return toast.info('敬请期待!')

  if (typeof url === 'function') return url()
  if (isUrl(url)) return toUrl(url)
  replaceTo(url)
}

/**
 * 重新加载页面。
 */
export function reload(): void {
  window.location.reload()
}

/**
 * 将电话号码转换为拨号链接并跳转到拨号页面。
 * @param phone - 电话号码
 */
export function toTel(phone?: string): void {
  if (!phone) return
  window.location.href = `tel:${phone}`
}
