import { myDialog } from '@/plugins/vant/dialog'
import { isDingDing } from '@/utils/platform/dingtalk'
import { isWeChat } from '@/utils/platform/ua'

let isScanning = false
export function showScan() {
  return new Promise<string>(async (resolve, reject) => {
    if (isScanning) return reject('扫码功能正在运行中')
    isScanning = true

    if (isWeChat()) {
      try {
        const { wechatScan } = await import('@/utils/platform/wechat')
        const result = await wechatScan()
        if (result) resolve(result)
        else reject('取消扫码')
      } catch (error) {
        reject(error)
      } finally {
        isScanning = false
      }
      return
    }

    if (isDingDing()) {
      import('dingtalk-jsapi')
        .then(({ biz }) => {
          biz.util
            .scan({ type: 'qrCode' })
            .then((res) => {
              if (res.text) resolve(res.text)
              else reject('取消扫码')
            })
            .catch((error) => {
              reject(error)
            })
            .finally(() => {
              isScanning = false
            })
        })
        .catch((error) => {
          reject(error)
          isScanning = false
        })
      return
    }

    let browserScanner: typeof import('@/utils/platform/browserScan') | undefined
    try {
      browserScanner = await import('@/utils/platform/browserScan')
      resolve(await browserScanner.browserScan())
    } catch (error) {
      if (error !== browserScanner?.SCAN_CANCELLED) {
        myDialog({ message: '无法打开相机，请检查相机权限并使用安全网址访问' })
      }
      reject(error)
    } finally {
      isScanning = false
    }
  })
}
