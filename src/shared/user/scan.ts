import { isDingDing } from '@/shared/integrations/dingtalk'
import { wechatScan } from '@/shared/integrations/wx'
import { isWeChat } from '@/utils/browser/ua'
import { biz } from 'dingtalk-jsapi'
import { showDialog } from 'vant'

let isScanning = false
export function openScanQR() {
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
      showDialog({ message: '请在微信或钉钉中使用扫码功能' })
    }
  })
}
