import type { ResData } from '@/api/types'
import { devModel } from '@/config/env'
import { useLockRequest } from '@/hooks/network/useLockRequest'

export interface WanImageResult {
  images: string[]
  requestId?: string
  seed?: number
  usage?: Record<string, unknown>
}

export function useWanImageRequest() {
  const { post, lock } = useLockRequest(false, 0)

  const generate = (image: File) => {
    return post<ResData<WanImageResult>>(
      `${devModel ? 'http://127.0.0.1:3002/imagev2' : 'https://api.yul.ink/imagev2'}`,
      { image },
      { timeout: 200000 },
      'FormData',
    )
  }

  return { generate, loading: lock }
}
