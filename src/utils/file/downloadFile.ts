import { toUrl } from '@/utils/navigation'
import { useLock } from '@/hooks/state/useLock'
import { failToast, loadingToast } from '@/plugins/vant/toast'
import { isWeChat } from '@/utils/platform/ua'
import { isIOS } from '@vueuse/core'
import { closeToast } from 'vant'

const [status, lock, unLock] = useLock()

export async function downloadFile(url: string, filename?: string) {
  if (typeof fetch === 'function' && isWeChat() && isIOS) {
    if (status.value) return
    lock()
    loadingToast('下载中...')

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`下载失败: HTTP ${response.status}`)

      const blob = await response.blob()
      const downloadName = decodeURIComponent(filename ?? url.split('/').pop() ?? 'download')
      const tempUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = tempUrl
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(tempUrl), 1000)
      closeToast()
    } catch {
      closeToast()
      failToast('下载失败')
    } finally {
      window.setTimeout(unLock, 500)
    }
    return
  }

  toUrl(url)
}
