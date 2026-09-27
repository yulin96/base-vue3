import { useClient, type UseClientOptions } from '@/hooks/network/useClient'

export const useMqtt = <T = unknown>(
  channel: string,
  onMessage?: (message: T) => void,
  options: UseClientOptions = {},
) => {
  return useClient<T>(channel, undefined, undefined, options, onMessage)
}
