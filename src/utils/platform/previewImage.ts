import { isWeChat } from '@/utils/platform/ua'
import { isHttps } from '@/utils/validate'

import { showImagePreview } from 'vant'
import 'vant/es/image-preview/style'

let wechatPreviewImagePromise: Promise<(current: string, urls: string[]) => void> | null = null
const loadWechatPreviewImage = async () => {
  if (!wechatPreviewImagePromise) {
    wechatPreviewImagePromise = import('@/utils/platform/wechat')
      .then((mod) => mod.wechatPreviewImage)
      .catch((error) => {
        wechatPreviewImagePromise = null
        throw error
      })
  }
  return wechatPreviewImagePromise
}

export function previewImage(url: string[] | string, index: number = 0) {
  const imageUrls = Array.isArray(url) ? url : [url]

  if (isWeChat() && isHttps() && imageUrls[index]) {
    loadWechatPreviewImage()
      .then((wechatPreviewImage) => {
        wechatPreviewImage(imageUrls[index]!, imageUrls)
      })
      .catch(() => {
        showImagePreview({ images: imageUrls, startPosition: index, teleport: '#app' })
      })
  } else {
    showImagePreview({ images: imageUrls, startPosition: index, teleport: '#app' })
  }
}
