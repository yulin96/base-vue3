import { formDataToObj } from '@/utils/convert/form'
import { createApiSignature, isPostEncryptEnabled } from '@/utils/request-signature'
import { isFormData } from '@/utils/validate'
import { AxiosHeaders, toFormData, type InternalAxiosRequestConfig } from 'axios'

export type FormDataOrJson = 'FormData' | 'JSON'
type RequestData = Record<string, unknown>

export type PostRequestConfig = InternalAxiosRequestConfig & {
  postDataType?: FormDataOrJson
  postEncryptAction?: string
}

export function normalizePostRequest(config: PostRequestConfig) {
  return isPostEncryptEnabled ? encryptPostRequest(config) : buildPlainPostRequest(config)
}

function encryptPostRequest(config: PostRequestConfig) {
  const dataType = config.postDataType ?? 'JSON'
  const requestData = isFormData(config.data) ? formDataToObj(config.data) : config.data
  const { query, headers } = createApiSignature(
    requestData && typeof requestData === 'object' ? (requestData as RequestData) : {},
    getRequestAction(config),
  )

  const requestHeaders = AxiosHeaders.from(config.headers)
  Object.entries(headers).forEach(([key, value]) => requestHeaders.set(key, value))

  config.headers = requestHeaders
  config.data = dataType === 'FormData' ? toFormData({ query }) : { query }
  return config
}

function buildPlainPostRequest(config: PostRequestConfig) {
  if ((config.postDataType ?? 'JSON') === 'FormData' && config.data && !isFormData(config.data)) {
    config.data = toFormData(config.data as RequestData)
  }

  return config
}

function getRequestAction(config: InternalAxiosRequestConfig) {
  const customAction = (config as PostRequestConfig).postEncryptAction
  if (customAction) return customAction

  const url = config.url || ''

  try {
    const baseUrl = config.baseURL || location.origin
    const pathname = new URL(url, baseUrl).pathname
    return pathname.split('/').filter(Boolean).at(-1) || ''
  } catch {
    return url.split('?')[0].split('/').filter(Boolean).at(-1) || ''
  }
}
