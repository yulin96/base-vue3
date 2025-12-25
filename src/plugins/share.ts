import { isWeChat } from '@/utils/platform/ua'
import { wechatShare } from '@/utils/platform/wechat'

export function registerWechatShare() {
  const title = import.meta.env.VITE_APP_SHARE_TITLE
  const desc = import.meta.env.VITE_APP_SHARE_DESC
  const link = import.meta.env.VITE_APP_SHARE_LINK
  const imgUrl = import.meta.env.VITE_APP_SHARE_IMGURL

  isWeChat() && wechatShare({ title, desc, link, imgUrl })
}
