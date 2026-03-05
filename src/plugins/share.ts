import { isWeChat } from '@/utils/platform/ua'

export function registerWechatShare() {
  if (!isWeChat()) return

  const title = import.meta.env.VITE_APP_SHARE_TITLE
  const desc = import.meta.env.VITE_APP_SHARE_DESC
  const link = import.meta.env.VITE_APP_SHARE_LINK
  const imgUrl = import.meta.env.VITE_APP_SHARE_IMGURL

  void import('@/utils/platform/wechat').then(({ wechatShare }) => {
    wechatShare({ title, desc, link, imgUrl })
  })
}
