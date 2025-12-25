import { myDialog } from '@/plugins/vant/dialog'
import { isDingDing } from '@/utils/platform/dingtalk'
import { isWeChat } from '@/utils/platform/ua'
import { wechatScan } from '@/utils/platform/wechat'
import { biz } from 'dingtalk-jsapi'

let isScanning = false
export function showScan() {
  return new Promise<string>((resolve, reject) => {
    if (isScanning) return reject('扫码功能正在运行中')
    isScanning = true

    if (isWeChat()) {
      wechatScan()
        .then((resultStr) => {
          if (resultStr) resolve(resultStr)
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
