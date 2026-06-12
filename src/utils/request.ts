import { diagnoseAxiosError, getNetworkQualityInfo, reportArmsException } from '@/plugins/monitoring/arms'
import { formDataToObj } from '@/utils/convert/form'
import { createApiSignature, isPostEncryptEnabled } from '@/utils/request-signature'
import { isCanceledRequest, isFormData } from '@/utils/validate'
import axios, {
  AxiosHeaders,
  isAxiosError,
  toFormData,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

export type IFormDataOrJSON = 'FormData' | 'JSON'
type Dict = Record<string, unknown>
type PostRequestConfig = InternalAxiosRequestConfig & {
  postDataType?: IFormDataOrJSON
  postEncryptAction?: string
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
})

instance.interceptors.request.use((config) => {
  const requestConfig = config as PostRequestConfig

  if (String(requestConfig.method || '').toLowerCase() !== 'post') return config

  return normalizePostRequest(requestConfig)
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

function normalizePostRequest(config: PostRequestConfig) {
  return isPostEncryptEnabled ? encryptPostRequest(config) : buildPlainPostRequest(config)
}

function encryptPostRequest(config: PostRequestConfig) {
  const dataType = config.postDataType ?? 'FormData'
  const requestData = getRequestDataSource(config.data)
  const { query, headers } = createApiSignature(
    requestData && typeof requestData === 'object' ? (requestData as Dict) : {},
    getRequestAction(config),
  )

  config.headers = mergeRequestHeaders(config.headers, headers)
  config.data = dataType === 'FormData' ? toFormData({ query }) : { query }
  return config
}

function buildPlainPostRequest(config: PostRequestConfig) {
  if ((config.postDataType ?? 'FormData') === 'FormData' && config.data && !isFormData(config.data)) {
    config.data = toFormData(config.data as Dict)
  }

  return config
}

function getRequestDataSource(data: unknown) {
  return isFormData(data) ? formDataToObj(data) : data
}

function mergeRequestHeaders(headers: AxiosRequestConfig['headers'], signatureHeaders: Record<string, string>) {
  const requestHeaders = AxiosHeaders.from((headers ?? {}) as any)

  Object.entries(signatureHeaders).forEach(([key, value]) => {
    requestHeaders.set(key, value)
  })

  return requestHeaders
}

function getRequestAction(config?: AxiosRequestConfig) {
  const customAction = (config as PostRequestConfig | undefined)?.postEncryptAction
  if (customAction) return customAction

  const url = config?.url || ''

  try {
    const baseUrl = config?.baseURL || location.origin
    const pathname = new URL(url, baseUrl).pathname
    const segments = pathname.split('/').filter(Boolean)
    return segments.at(-1) || ''
  } catch {
    const pathname = url.split('?')[0]
    const segments = pathname.split('/').filter(Boolean)
    return segments.at(-1) || ''
  }
}

function reportRequestError(error: unknown) {
  if (isCanceledRequest(error)) return
  if (!isAxiosError(error)) return

  const { config, response } = error
  const responseData = response?.data as Dict | undefined
  const requestUrl = getRequestUrl(config)
  const responseStatus = error.status ?? response?.status ?? -1
  const responseMessage = getResponseMessage(responseData, error.message)

  const errorCategory = diagnoseAxiosError(error)
  const networkInfo = errorCategory !== 'success' ? getNetworkQualityInfo() : {}

  reportArmsException({
    name: 'APIRequestException',
    message: responseMessage,
    file: requestUrl,
    stack: error.stack,
    properties: {
      api_url: requestUrl,
      api_method: String(config?.method || '').toUpperCase(),
      api_status: responseStatus,
      api_code: typeof responseData?.code === 'number' ? responseData.code : String(responseData?.code || ''),
      api_business_status:
        typeof responseData?.status === 'number' ? responseData.status : String(responseData?.status || ''),
      api_request_data: stringifyData(getRequestData(config)),
      api_response_data: stringifyData(responseData),
      api_error_code: error.code || '',
      api_error_name: error.name || 'AxiosError',
      api_error_message: error.message || '',
      api_error_category: errorCategory,
      api_request_id:
        getResponseHeaderValue(response?.headers, 'x-request-id') ||
        getResponseHeaderValue(response?.headers, 'request-id') ||
        getResponseHeaderValue(response?.headers, 'trace-id'),
      page_url: location.href,
      ...networkInfo,
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
  if (!headers) return ''

  const headerValue = AxiosHeaders.from(headers as any).get(key)
  if (Array.isArray(headerValue)) return headerValue.join(',')
  return headerValue == null ? '' : String(headerValue)
}

function truncateText(value: string, maxLength = 2000) {
  return value.slice(0, maxLength)
}

function getResponseMessage(responseData: Dict | undefined, fallbackMessage: string) {
  if (typeof responseData?.message === 'string' && responseData.message) return responseData.message
  if (typeof responseData?.msg === 'string' && responseData.msg) return responseData.msg
  return fallbackMessage || 'request failed'
}

const BODY_REQUEST_METHODS = ['post', 'put', 'patch', 'delete']
