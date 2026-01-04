import { formDataToObj } from '@/utils/convert'
import { isFormData } from '@/utils/validate'
import axios, { toFormData, type AxiosInstance, type AxiosRequestConfig } from 'axios'

export type IFormDataOrJSON = 'FormData' | 'JSON'

const interceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config) => config)

  instance.interceptors.response.use(
    (response) => {
      const requestBody = {
        data: null as null | object,
        url: response.config?.url,
        method: response.config?.method,
        baseUrl: response.config?.baseURL ?? '',
      }

      const method = response.config.method?.toLowerCase()
      const data = method === 'post' ? response.config?.data : response.config?.params
      requestBody.data = isFormData(data) ? formDataToObj(data) : data

      response.data._request = requestBody

      return response
    },
    (error) => {
      return Promise.reject(error)
    },
  )
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
})

interceptor(instance)

export const axiosGet = <T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig<any>,
  data?: Record<string, any>,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    instance
      .get(url, {
        params,
        ...(data ? { data } : {}),
        // adapter: ['fetch', 'xhr'],
        ...config,
      })
      .then((response) => resolve(response.data))
      .catch((error) => reject(error))
  })
}

export const axiosPost = <T = any>(
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig<any>,
  dataType: IFormDataOrJSON = 'FormData',
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    instance
      .post(url, data && (dataType === 'FormData' ? toFormData(data) : data), {
        // adapter: ['fetch', 'xhr'],
        ...config,
      })
      .then((response) => resolve(response.data))
      .catch((error) => reject(error))
  })
}

export function getLocalJson(url: string) {
  return new Promise((resolve, reject) => {
    fetch('./' + url)
      .then((response) => response.json())
      .then((res) => {
        resolve(res)
      })
  })
}
