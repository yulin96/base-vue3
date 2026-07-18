import { myDialog } from '@/plugins/vant/dialog'
import { isDingDing } from '@/utils/platform/dingtalk'
import { isWeChat } from '@/utils/platform/ua'

let isScanning = false
export async function showScan(): Promise<string> {
  if (isScanning) throw '扫码功能正在运行中'
  isScanning = true

  try {
    if (isWeChat()) {
      const { wechatScan } = await import('@/utils/platform/wechat')
      const result = await wechatScan()
      if (!result) throw '取消扫码'
      return result
    }

    if (isDingDing()) {
      const { biz } = await import('dingtalk-jsapi')
      const result = await biz.util.scan({ type: 'qrCode' })
      if (!result.text) throw '取消扫码'
      return result.text
    }

    let browserScanner: typeof import('@/utils/platform/browserScan') | undefined
    try {
      browserScanner = await import('@/utils/platform/browserScan')
      return await browserScanner.browserScan()
    } catch (error) {
      if (error !== browserScanner?.SCAN_CANCELLED) {
        myDialog({ message: '无法打开相机，请检查相机权限并使用安全网址访问' })
      }
      throw error
    }
  } finally {
    isScanning = false
  }
}
