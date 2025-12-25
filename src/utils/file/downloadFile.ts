import { toUrl } from '@/config/urls'
import { useLock } from '@/hooks/useLock'
import { failToast, loadingToast } from '@/plugins/vant/toast'
import { isWeChat } from '@/utils/platform/ua'
import { isIOS } from '@vueuse/core'
import { closeToast } from 'vant'

const [status, lock, unLock] = useLock()

export function downloadFile(url: string, filename?: string) {
  if (typeof fetch === 'function' && isWeChat() && isIOS) {
    if (status.value) return
    lock()
    loadingToast('下载中...')
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        closeToast()

        const tempUrl = URL.createObjectURL(new Blob([blob]))
        const a = document.createElement('a')
        a.href = tempUrl
        a.download = decodeURIComponent(filename ?? url.split('/')?.pop() ?? 'download')
        a.click()
        URL.revokeObjectURL(tempUrl)
      })
      .catch(() => {
        closeToast()
        failToast('下载失败')
      })
      .finally(() => {
        setTimeout(() => {
          unLock()
        }, 500)
      })
  } else {
    toUrl(url)
  }
}
