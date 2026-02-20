import { formDataToObj } from '@/utils/convert'
import { isFormData } from '@/utils/validate'
import axios, { toFormData, type AxiosInstance, type AxiosRequestConfig } from 'axios'

export type IFormDataOrJSON = 'FormData' | 'JSON'
type Dict = Record<string, unknown>
type RequestMeta = {
  data: Dict | null
  url?: string
  method?: string
  baseUrl: string
}

const interceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config) => {
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      const requestBody: RequestMeta = {
        data: null,
        url: response.config?.url,
        method: response.config?.method,
        baseUrl: response.config?.baseURL ?? '',
      }

      const method = response.config.method?.toLowerCase()
      const data = method === 'post' ? response.config?.data : response.config?.params
      requestBody.data = (isFormData(data) ? formDataToObj(data) : (data ?? null)) as Dict | null

      if (response.data && typeof response.data === 'object') {
        ;(response.data as Dict)._request = requestBody
      }

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

export const axiosGet = <T = any>(url: string, params?: Dict, config?: AxiosRequestConfig, data?: Dict): Promise<T> => {
  return instance
    .get(url, {
      params,
      ...(data ? { data } : {}),
      ...config,
    })
    .then((response) => {
      return response.data as T
    })
}

export const axiosPost = <T = any>(
  url: string,
  data?: Dict,
  config?: AxiosRequestConfig,
  dataType: IFormDataOrJSON = 'FormData',
): Promise<T> => {
  return instance
    .post(url, data && (dataType === 'FormData' ? toFormData(data) : data), {
      ...config,
    })
    .then((response) => {
      return response.data as T
    })
}
