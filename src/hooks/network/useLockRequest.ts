import { isAxiosError, type AxiosRequestConfig } from 'axios'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import { axiosGet, axiosPost, type IFormDataOrJSON } from '@/utils/request'

export function useLockRequest(disableLock = false, delay = 500, options: { silent?: boolean } = {}) {
  const pending = ref(0)
  const status = computed(() => pending.value > 0)

  const makeRequest = async <T>(requestFn: () => Promise<T>): Promise<T> => {
    if (status.value && !disableLock) {
      throw { code: -9996, error: '请求正在进行中，请稍后再试' }
    }

    pending.value++

    try {
      return await requestFn()
    } catch (error) {
      if (!options.silent && isAxiosError(error)) {
        if (error.response?.status === 500) {
          toast.warning('正在处理中...')
        } else if (error.code === 'ERR_NETWORK' && navigator.onLine === false) {
          toast.warning('网络已断开，请检查网络')
        }
      }
      throw error
    } finally {
      const unlock = () => {
        pending.value--
      }
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

  return { post, get, lock: status }
}
