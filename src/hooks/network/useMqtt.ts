import { useClient, type UseClientOptions } from '@/hooks/network/useClient'
import { watch } from 'vue'

export const useMqtt = <T = unknown>(
  channel: string,
  onMessage?: (message: T) => void,
  options: UseClientOptions = {},
) => {
  const client = useClient<T>(channel, undefined, undefined, options)

  if (onMessage) {
    watch(
      client.data,
      (message) => {
        if (message !== undefined) onMessage(message as T)
      },
      { flush: 'sync' },
    )
  }

  return client
}
