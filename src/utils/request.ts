import { devModel } from '@/config/env'
import { normalizePostRequest, type FormDataOrJson, type PostRequestConfig } from '@/utils/request-payload'
import axios, { type AxiosRequestConfig } from 'axios'

export type IFormDataOrJSON = FormDataOrJson
type Dict = Record<string, unknown>

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL.replace('c26.event1.cn', devModel ? 'c26-test.event1.cn' : 'c26.event1.cn'),
})

instance.interceptors.request.use((config) => {
  const requestConfig = config as PostRequestConfig

  if (String(requestConfig.method || '').toLowerCase() !== 'post') return config

  return normalizePostRequest(requestConfig)
})

export const axiosGet = <T = unknown>(
  url: string,
  params?: Dict,
  config?: AxiosRequestConfig,
  data?: Dict,
): Promise<T> => {
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

export const axiosPost = <T = unknown>(
  url: string,
  data?: Dict,
  config?: AxiosRequestConfig,
  dataType: IFormDataOrJSON = 'JSON',
): Promise<T> => {
  return instance
    .post(url, data, {
      ...(config ?? {}),
      ...(dataType === 'FormData' ? { postDataType: dataType } : undefined),
    } as PostRequestConfig)
    .then((response) => {
      return response.data as T
    })
}
