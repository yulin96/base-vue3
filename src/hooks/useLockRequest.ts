import { useLock } from '@/hooks/useLock'
import { infoToast } from '@/plugins/vant/toast'
import { axiosGet, axiosPost, type IFormDataOrJSON } from '@/utils/request'
import { isCanceledRequest } from '@/utils/validate'
import type { AxiosRequestConfig } from 'axios'
import { readonly } from 'vue'

export function useLockRequest(disableLock = false, delay = 500) {
  const [status, lock, unLock] = useLock()

  const makeRequest = <T>(requestFn: () => Promise<T>): Promise<T> => {
    if (status.value && !disableLock) {
      return Promise.reject({ code: -9996, error: '请求正在进行中，请稍后再试' })
    }

    lock()

    return new Promise((resolve, reject) => {
      requestFn()
        .then(resolve)
        .catch((err) => {
          reject(err)
          if (!isCanceledRequest(err)) {
            infoToast('正在加载中...')
          }
        })
        .finally(() => {
          const unlock = () => unLock()
          delay ? setTimeout(unlock, delay) : unlock()
        })
    })
  }

  const post = <T = any>(
    url: string,
    data?: Record<string, any>,
    config?: AxiosRequestConfig<any>,
    dataType?: IFormDataOrJSON,
  ): Promise<T> => {
    return makeRequest(() => axiosPost(url, data, config, dataType))
  }

  const get = <T = any>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig<any>,
    data?: Record<string, any>,
  ): Promise<T> => {
    return makeRequest(() => axiosGet(url, params, config, data))
  }

  return { post, get, lock: readonly(status) }
}
