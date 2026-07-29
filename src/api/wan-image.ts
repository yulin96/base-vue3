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

  const href = location.href
  let url = ''
  if (href.includes('__test__')) {
    url = 'https://hjc.event1.cn/api/oceanstor/bust/generate'
  } else {
    if (devModel) {
      url = `http://127.0.0.1:3002/imagev2`
    } else {
      const version = params.get('v') || ''
      url = `https://api.yul.ink/imagev2${version ? `-${version}` : ''}`
    }
  }

  const generate = (image: File) => {
    return post<ResData<WanImageResult>>(url, { image }, { timeout: 200000 }, 'FormData')
  }

  return { generate, loading: lock }
}
