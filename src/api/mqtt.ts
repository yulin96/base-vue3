import type { ResData } from '@/api/types'
import { devModel } from '@/config/env'
import { useLockRequest } from '@/hooks/network/useLockRequest'
import type { AxiosRequestConfig } from 'axios'

export type MqttPayload = Record<string, unknown>

const { post: postSendMqtt } = useLockRequest()

export const apiSendMqtt = (channel: string, data: MqttPayload, config?: AxiosRequestConfig<any>) => {
  return new Promise<[null, ResData] | [Error, null]>((resolve) => {
    postSendMqtt<ResData>(
      'https://c26.event1.cn/vdwins3c/sendMqtt'.replace(
        'c26.event1.cn',
        devModel ? 'c26-test.event1.cn' : 'c26.event1.cn',
      ),
      { ...data, channel },
      config,
    )
      .then((res) => {
        resolve([null, res])
      })
      .catch((err: Error) => {
        resolve([err, null])
      })
  })
}
