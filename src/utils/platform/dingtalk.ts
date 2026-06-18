export function isDingDing() {
  return /DingTalk/i.test(navigator.userAgent)
}

export async function hideDingTalkShare() {
  if (!isDingDing()) return

  try {
    const { biz } = await import('dingtalk-jsapi')
    void biz.navigation.setRight({ show: false }).catch(console.log)
  } catch (error) {
    console.error('隐藏钉钉分享按钮失败:', error)
  }
}
