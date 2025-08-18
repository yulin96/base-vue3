import { useLock } from '@/hooks/useLock'
import { type IFormDataOrJSON, axiosGet, axiosPost } from '@/shared/request'
import type { AxiosRequestConfig } from 'axios'
import nprogress from 'nprogress'
import { readonly } from 'vue'
import { toast } from 'vue-sonner'

nprogress.configure({
  showSpinner: false,
  minimum: 0.3,
  trickleSpeed: 120,
})

export function useLockRequest(disableLock = false, showProgress = false, delay = 500) {
  const [status, lock, unLock] = useLock()

  const makeRequest = <T>(requestFn: () => Promise<T>): Promise<T> => {
    if (status.value && !disableLock) {
      return Promise.reject({ code: -9996, error: '请求正在进行中，请稍后再试' })
    }

    showProgress && nprogress?.start()
    lock()

    return new Promise((resolve, reject) => {
      let toastId: string | number | null = null
      const requestTimer = setTimeout(() => {
        toastId = toast.loading('加载中...')
      }, 3000)

      requestFn()
        .then(resolve)
        .catch((err) => {
          reject(err)
          if (err.name !== 'CanceledError' || err.message === 'Request aborted') {
            toast.error('正在加载中...', { duration: 3000 })
          }
        })
        .finally(() => {
          clearTimeout(requestTimer)
          if (toastId !== null) toast.dismiss(toastId)

          showProgress && nprogress?.done()

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
