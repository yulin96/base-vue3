import { wechatPreviewImage } from '@/utils/libs/wx'
import { isWeChat } from '@/utils/platform/ua'
import { isHttps } from '@/utils/validate'

import { showImagePreview } from 'vant'
import 'vant/es/image-preview/style'

export function showImage(url: string[] | string, index: number = 0) {
  const imageUrls = Array.isArray(url) ? url : [url]

  if (isWeChat() && isHttps() && imageUrls[index]) {
    wechatPreviewImage(imageUrls[index], imageUrls)
  } else {
    showImagePreview({ images: imageUrls, startPosition: index, teleport: '#app' })
  }
}
