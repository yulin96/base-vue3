import { isWeChat } from '@/utils/platform/ua'

export async function registerWechatShare() {
  if (!isWeChat()) return

  const title = import.meta.env.VITE_APP_SHARE_TITLE
  const desc = import.meta.env.VITE_APP_SHARE_DESC
  const link = import.meta.env.VITE_APP_SHARE_LINK
  const imgUrl = import.meta.env.VITE_APP_SHARE_IMGURL

  const { wechatShare } = await import('@/utils/platform/wechat')

  wechatShare({ title, desc, link: getShareLinkWithTimestamp(link), imgUrl })
}

function getShareLinkWithTimestamp(link?: string): string {
  const rawLink = link || location.href.split('#')[0] || ''
  if (!rawLink) return ''

  try {
    const url = new URL(rawLink, location.origin)
    url.searchParams.set('t', Date.now().toString())
    return url.toString()
  } catch {
    const [urlWithoutHash, hash = ''] = rawLink.split('#')
    const separator = urlWithoutHash.includes('?') ? '&' : '?'
    const nextUrl = `${urlWithoutHash}${separator}t=${Date.now()}`

    return hash ? `${nextUrl}#${hash}` : nextUrl
  }
}
