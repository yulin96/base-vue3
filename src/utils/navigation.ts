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
