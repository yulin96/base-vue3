import { useLock } from '@/hooks/state/useLock'
import { axiosGet, axiosPost, type IFormDataOrJSON } from '@/utils/request'
import { isCanceledRequest } from '@/utils/validate'
import type { AxiosRequestConfig } from 'axios'
import { readonly } from 'vue'
import { toast } from 'vue-sonner'

export function useLockRequest(disableLock = false, delay = 500) {
  const [status, lock, unLock] = useLock()

  const makeRequest = async <T>(requestFn: () => Promise<T>): Promise<T> => {
    if (status.value && !disableLock) {
      throw { code: -9996, error: '请求正在进行中，请稍后再试' }
    }

    lock()

    try {
      return await requestFn()
    } catch (error) {
      if (!isCanceledRequest(error)) {
        toast.warning('正在处理中...')
      }
      throw error
    } finally {
      const unlock = () => unLock()
      delay ? setTimeout(unlock, delay) : unlock()
    }
  }

  const post = <T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig,
    dataType?: IFormDataOrJSON,
  ): Promise<T> => {
    return makeRequest(() => axiosPost(url, data, config, dataType))
  }

  const get = <T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig,
    data?: Record<string, unknown>,
  ): Promise<T> => {
    return makeRequest(() => axiosGet(url, params, config, data))
  }

  return { post, get, lock: readonly(status) }
}
