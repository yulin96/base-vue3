import type { ResData } from '@/api/types'
import { useLockRequest } from '@/hooks/network/useLockRequest'

export interface WanImageResult {
  images: string[]
  requestId?: string
  seed?: number
  usage?: Record<string, unknown>
}

export function useWanImageRequest() {
  const { post, lock } = useLockRequest(false, 0)

  const generate = (image: string) => {
    return post<ResData<WanImageResult>>(
      !location.href.includes('__test__') ? 'https://api.yul.ink/qwen-image' : 'https://api.yul.ink/image',
      { image },
      { timeout: 200000 },
      'FormData',
    )
  }

  return { generate, loading: lock }
}
