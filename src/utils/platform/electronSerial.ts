import { electronApi } from '@/config/env'
import type { SerialAPI } from '../../../types/serial'

export type { SerialAPI, SerialPayload, SerialReceived } from '../../../types/serial'

function clientSerial(): SerialAPI {
  if (!electronApi?.serial) throw new Error('当前环境未提供串口接口，请使用配套客户端')
  return electronApi.serial
}

export const electronSerial: SerialAPI = {
  async send(number, payload) {
    await clientSerial().send(number, payload)
  },
  receive(number, callback) {
    return clientSerial().receive(number, callback)
  },
}
