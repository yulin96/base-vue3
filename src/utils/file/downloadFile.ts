import { useLock } from '@/hooks/useLock'
import { createToaster } from '@/shared/user/createToaster'
import { toUrl } from '@/shared/user/location'
import { isWeChat } from '@/utils/browser/ua'
import { isIOS } from '@vueuse/core'

const [status, lock, unLock] = useLock()

export function downloadFile(url: string, filename?: string) {
  if (typeof fetch === 'function' && isWeChat() && isIOS) {
    if (status.value) return
    lock()
    const { resolve, reject } = createToaster('下载中...')
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        resolve('下载完成')
        const tempUrl = URL.createObjectURL(new Blob([blob]))
        const a = document.createElement('a')
        a.href = tempUrl
        a.download = decodeURIComponent(filename ?? url.split('/')?.pop() ?? 'download')
        a.click()
        URL.revokeObjectURL(tempUrl)
      })
      .catch(() => {
        reject('下载失败')
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
