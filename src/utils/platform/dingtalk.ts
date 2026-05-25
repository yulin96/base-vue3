import { biz, env } from 'dingtalk-jsapi'

export function isDingDing() {
  return env.platform !== 'notInDingTalk'
}

export function hideDingTalkShare() {
  if (!isDingDing()) return

  void biz.navigation.setRight({ show: false }).catch(console.log)
}
