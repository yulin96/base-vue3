import { wechatPreviewImage } from '@/shared/third/wx'
import { isWeChat } from '@/utils/ua'
import { isHttps } from '@/utils/validator'
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
