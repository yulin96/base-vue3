import { myDialog } from '@/plugins/vant/dialog'
import { isDingDing } from '@/utils/platform/dingtalk'
import { isWeChat } from '@/utils/platform/ua'
import { biz } from 'dingtalk-jsapi'

let wechatScanPromise: Promise<() => Promise<string | void>> | null = null
const loadWechatScan = async () => {
  if (!wechatScanPromise) {
    wechatScanPromise = import('@/utils/platform/wechat')
      .then((mod) => mod.wechatScan)
      .catch((error) => {
        wechatScanPromise = null
        throw error
      })
  }
  return wechatScanPromise
}

let isScanning = false
export function showScan() {
  return new Promise<string>((resolve, reject) => {
    if (isScanning) return reject('扫码功能正在运行中')
    isScanning = true

    if (isWeChat()) {
      loadWechatScan()
        .then((wechatScan) => wechatScan())
        .then((resultStr) => {
          if (resultStr) resolve(resultStr as string)
        })
        .catch(() => {})
        .finally(() => {
          isScanning = false
        })
    } else if (isDingDing()) {
      biz.util
        .scan({ type: 'qrCode' })
        .then((res) => {
          if (res.text) resolve(res.text)
        })
        .catch(() => {})
        .finally(() => {
          isScanning = false
        })
    } else {
      isScanning = false
      myDialog({ message: '请在微信或钉钉中使用扫码功能' })
    }
  })
}
