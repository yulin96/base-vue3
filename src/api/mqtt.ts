import type { ResData } from '@/api/types'
import { services } from '@/config/services'
import { useLockRequest } from '@/hooks/network/useLockRequest'
import type { AxiosRequestConfig } from 'axios'

export type MqttPayload = Record<string, unknown>

const { post: postSendMqtt } = useLockRequest()

export const apiSendMqtt = (channel: string, data: MqttPayload, config?: AxiosRequestConfig<any>) => {
  return new Promise<[null, ResData] | [Error, null]>((resolve) => {
    postSendMqtt<ResData>(services.mqtt.publishUrl, { ...data, channel }, config)
      .then((res) => {
        resolve([null, res])
      })
      .catch((err: Error) => {
        resolve([err, null])
      })
  })
}
