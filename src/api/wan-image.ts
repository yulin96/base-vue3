import type { ResData } from '@/api/types'
import { devModel } from '@/config/env'
import { useLockRequest } from '@/hooks/network/useLockRequest'

export interface WanImageResult {
  images: string[]
  requestId?: string
  seed?: number
  usage?: Record<string, unknown>
}

const params = new URLSearchParams(location.search)
const version = params.get('v') || ''

export function useWanImageRequest() {
  const { post, lock } = useLockRequest(false, 0)

  const generate = (image: File) => {
    return post<ResData<WanImageResult>>(
      `${location.href.includes('__test__') ? 'https://hjc.event1.cn/api/oceanstor/bust/generate' : devModel ? `http://127.0.0.1:3002/imagev2${version ? `?-${version}` : ''}` : `https://api.yul.ink/imagev2${version ? `?-${version}` : ''}`}`,
      { image },
      { timeout: 200000 },
      'FormData',
    )
  }

  return { generate, loading: lock }
}
