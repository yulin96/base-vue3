import { useLock } from '@/hooks/useLock'
import { showFailToast, showLoadingToast } from '@/shared/plugins/vant/toast'
import { axiosGet, axiosPost, type IFormDataOrJSON } from '@/shared/request'
import type { AxiosRequestConfig } from 'axios'
import nprogress from 'nprogress'
import { closeToast } from 'vant'
import { readonly } from 'vue'

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
      let isShowLoading = false
      const requestTimer = setTimeout(() => {
        isShowLoading = true
        showLoadingToast('加载中...')
      }, 12000)

      requestFn()
        .then(resolve)
        .catch((err) => {
          reject(err)
          if (err.name !== 'CanceledError' || err.message === 'Request aborted') {
            showFailToast('正在加载中...')
          }
        })
        .finally(() => {
          clearTimeout(requestTimer)
          if (isShowLoading) closeToast()

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
