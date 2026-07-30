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

export function useWanImageRequest() {
  const { post, lock } = useLockRequest(false, 0)

  const href = location.href
  let url = ''
  if (href.includes('__test__')) {
    url = 'https://hjc.event1.cn/api/oceanstor/bust/generate'
  } else {
    if (devModel) {
      url = `http://127.0.0.1:3002/ai/gen-avatar`
    } else {
      url = `https://node-aiphoto.event1.cn/ai/gen-avatar`
    }
  }

  const generate = (imageUrl: string) => {
    return post<ResData<WanImageResult>>(url, { imageUrl }, { timeout: 200000 }, 'FormData')
  }

  return { generate, loading: lock }
}
