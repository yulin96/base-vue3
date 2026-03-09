import { isWeChat } from '@/utils/platform/ua'
import { isHttps } from '@/utils/validate'

import { showImagePreview } from 'vant'
import 'vant/es/image-preview/style'

export async function previewImage(url: string[] | string, index: number = 0) {
  const imageUrls = Array.isArray(url) ? url : [url]
  const previewByVant = () => {
    showImagePreview({ images: imageUrls, startPosition: index, teleport: '#app' })
  }

  if (isWeChat() && isHttps() && imageUrls[index]) {
    const { wechatPreviewImage } = await import('@/utils/platform/wechat')
    wechatPreviewImage(imageUrls[index]!, imageUrls, previewByVant)

    return
  } else {
    previewByVant()
  }
}
