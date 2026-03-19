import { formDataToObj } from '@/utils/convert'
import { reportArmsException } from '@/plugins/arms'
import { isCanceledRequest, isFormData } from '@/utils/validate'
import axios, { isAxiosError, toFormData, type AxiosRequestConfig } from 'axios'

export type IFormDataOrJSON = 'FormData' | 'JSON'
type Dict = Record<string, unknown>

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
})

instance.interceptors.response.use(undefined, (error) => {
  reportRequestError(error)
  return Promise.reject(error)
})

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

function reportRequestError(error: unknown) {
  if (isCanceledRequest(error)) return
  if (!isAxiosError(error)) return

  const { config, response } = error
  const responseData = response?.data as Dict | undefined
  const requestUrl = getRequestUrl(config)
  const responseStatus = response?.status
  const responseMessage =
    typeof responseData?.message === 'string'
      ? responseData.message
      : typeof responseData?.msg === 'string'
        ? responseData.msg
        : error.message || 'request failed'

  reportArmsException({
    name: 'APIRequestException',
    message: responseMessage,
    file: requestUrl,
    stack: error.stack,
    properties: {
      api_url: requestUrl,
      api_method: String(config?.method || '').toUpperCase(),
      api_status: responseStatus ?? -1,
      api_code: typeof responseData?.code === 'number' ? responseData.code : String(responseData?.code || ''),
      api_business_status:
        typeof responseData?.status === 'number' ? responseData.status : String(responseData?.status || ''),
      api_request_data: stringifyData(getRequestData(config)),
      api_response_data: stringifyData(responseData),
      api_error_code: error.code || '',
      api_error_name: error.name || 'AxiosError',
      api_error_message: error.message || '',
      api_request_id:
        getResponseHeaderValue(response?.headers, 'x-request-id') ||
        getResponseHeaderValue(response?.headers, 'request-id') ||
        getResponseHeaderValue(response?.headers, 'trace-id'),
      page_url: location.href,
    },
  })
}

function getRequestData(config?: AxiosRequestConfig) {
  const method = String(config?.method || '').toLowerCase()
  const data = BODY_REQUEST_METHODS.includes(method) ? config?.data : (config?.params ?? config?.data)
  return isFormData(data) ? formDataToObj(data) : data
}

function stringifyData(value: unknown) {
  if (value == null) return ''
  if (typeof value === 'string') return truncateText(value)
  if (typeof Blob !== 'undefined' && value instanceof Blob) return `[Blob:${value.type || 'unknown'}]`
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return `[ArrayBuffer:${value.byteLength}]`
  if (isFormData(value)) return truncateText(JSON.stringify(formDataToObj(value)))

  try {
    return truncateText(JSON.stringify(value))
  } catch {
    return truncateText(String(value))
  }
}

function getRequestUrl(config?: AxiosRequestConfig) {
  const url = config?.url || ''
  const baseUrl = config?.baseURL || location.origin

  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return url
  }
}

function getResponseHeaderValue(headers: unknown, key: string) {
  if (!headers || typeof headers !== 'object') return ''

  const targetKey = key.toLowerCase()

  for (const [headerKey, headerValue] of Object.entries(headers)) {
    if (headerKey.toLowerCase() !== targetKey) continue
    if (Array.isArray(headerValue)) return headerValue.join(',')
    return headerValue == null ? '' : String(headerValue)
  }

  return ''
}

function truncateText(value: string, maxLength = 2000) {
  return value.slice(0, maxLength)
}

const BODY_REQUEST_METHODS = ['post', 'put', 'patch', 'delete']
