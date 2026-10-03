import { useClient, type UseClientOptions } from '@/hooks/network/useClient'

export interface UseMqttOptions extends UseClientOptions {
  pub?: string
  sub?: string
}

export const useMqtt = <T = unknown>(
  channel: string,
  onMessage?: (message: T) => void,
  options: UseMqttOptions = {},
) => {
  const { pub, sub, ...clientOptions } = options
  return useClient<T>(channel, pub, sub, clientOptions, onMessage)
}
