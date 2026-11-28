import { AxiosHeaders, toFormData, type InternalAxiosRequestConfig } from 'axios'

import { isPostEncryptEnabled } from '@/config/env'
import { formDataToObj } from '@/utils/convert/form'
import { isFormData } from '@/utils/validate'

export type FormDataOrJson = 'FormData' | 'JSON'
type RequestData = Record<string, unknown>

export type PostRequestConfig = InternalAxiosRequestConfig & {
  postDataType?: FormDataOrJson
  postEncryptAction?: string
  postEncrypt?: boolean
}

export function normalizePostRequest(config: PostRequestConfig) {
  return isPostEncryptEnabled && config.postEncrypt !== false
    ? encryptPostRequest(config)
    : buildPlainPostRequest(config)
}

async function encryptPostRequest(config: PostRequestConfig) {
  const { createApiSignature } = await import('@/utils/request-signature')
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

function getLastPathSegment(value: string) {
  const segments = value.split('/').filter(Boolean)
  return segments[segments.length - 1] || ''
}

function getRequestAction(config: InternalAxiosRequestConfig) {
  const customAction = (config as PostRequestConfig).postEncryptAction
  if (customAction) return customAction

  const url = config.url || ''

  try {
    const baseUrl = config.baseURL || location.origin
    const pathname = new URL(url, baseUrl).pathname
    return getLastPathSegment(pathname)
  } catch {
    return getLastPathSegment(url.split('?')[0])
  }
}
