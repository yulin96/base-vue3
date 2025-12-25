import { env } from 'dingtalk-jsapi'

export function isDingDing() {
  return env.platform !== 'notInDingTalk'
}
