import { isCanceledRequest } from '@/utils/validate'

type ArmsPropertyValue = string | number
type ArmsExceptionPayload = {
  name: string
  message: string

  file?: string
  stack?: string
  line?: number
  column?: number
  properties?: Record<string, unknown>
}

const truncateText = (value: string, maxLength = 2000) => value.slice(0, maxLength)
const getErrorLikeValue = (error: unknown, key: 'name' | 'code' | 'message') => {
  if (!error || typeof error !== 'object') return ''

  const value = (error as Record<string, unknown>)[key]
  return value == null ? '' : String(value)
}

const getApiErrorCategory = (response?: Response | Record<string, unknown> | null, error?: unknown) => {
  if (isCanceledRequest(error)) return 'canceled'

  const status = typeof response?.status === 'number' ? response.status : undefined
  if (typeof status === 'number' && status >= 500) return 'server_error'
  if (typeof status === 'number' && status >= 400) return 'request_error'
  if (error) return 'network_error'

  return 'success'
}

const getApiErrorMessage = (
  responseText: string,
  response?: Response | Record<string, unknown> | null,
  error?: unknown,
) => {
  if (isCanceledRequest(error)) return 'request canceled'

  const errorMessage = getErrorLikeValue(error, 'message')
  if (errorMessage) return errorMessage

  if (responseText) {
    try {
      const responseData = JSON.parse(responseText) as Record<string, unknown>
      const businessMessage = responseData.message ?? responseData.msg ?? responseData.error
      if (businessMessage != null) return String(businessMessage)
    } catch {
      return responseText
    }
  }

  const status = typeof response?.status === 'number' ? response.status : undefined
  const statusText = response?.statusText == null ? '' : String(response.statusText)

  if (typeof status === 'number') return statusText ? `HTTP ${status} ${statusText}` : `HTTP ${status}`

  return ''
}

const normalizeArmsPropertyValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'boolean') return Number(value)
  if (value == null) return ''

  return truncateText(String(value))
}

const normalizeArmsProperties = (properties?: Record<string, unknown>) => {
  if (!properties) return undefined

  const result: Record<string, ArmsPropertyValue> = {}
  let count = 0

  for (const [key, value] of Object.entries(properties)) {
    if (count >= 20) break

    const normalizedKey = key.slice(0, 50)
    const normalizedValue = normalizeArmsPropertyValue(value)

    if (!normalizedKey || normalizedValue === undefined) continue

    result[normalizedKey] = normalizedValue
    count += 1
  }

  return count ? result : undefined
}

const getArmsRum = () => window.RumSDK?.default

export function reportArmsException(payload: ArmsExceptionPayload) {
  try {
    const armsRum = getArmsRum()

    if (!armsRum?.sendException) return

    armsRum.sendException({
      ...payload,
      name: payload.name || 'RequestException',
      message: truncateText(payload.message || 'unknown error', 1000),
      file: payload.file ? truncateText(payload.file, 1000) : undefined,
      stack: payload.stack ? truncateText(payload.stack) : undefined,
      properties: normalizeArmsProperties(payload.properties),
    })
  } catch (error) {
    console.error('ARMS 异常上报失败:', error)
  }
}

export function registerARMS() {
  try {
    ;(function () {
      const config = {
        endpoint: __ARMSEndpoint,
        env: 'prod',
        spaMode: 'hash',
        app: {
          package: document.title || 'unknown',
        },
        user: {
          tags: document.title || 'unknown',
        },
        parseViewName() {
          return location.origin + location.pathname + location.hash.split('?')?.[0]
        },
        collectors: {
          perf: true, // 页面性能指标
          webVitals: true, // WebVitals 指标
          api: true, // Ajax/Fetch 请求监听
          staticResource: true, // 静态资源加载监听
          jsError: true, // JS 运行错误监听
          consoleError: true, // 控制台 error 监听
          action: true, // 用户行为点击监听
        },
        tracing: false,

        evaluateApi: async (options, response, error) => {
          let requestData = ''
          let responseText = ''

          const method = String(options.method || '').toLowerCase()
          const normalizeJsonText = (value: string) => {
            const text = value.trim()
            if (!text) return ''

            const firstChar = text[0]
            const lastChar = text[text.length - 1]
            const isJsonText = (firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']')

            if (!isJsonText) return value

            try {
              return JSON.stringify(JSON.parse(text))
            } catch {
              return value
            }
          }
          const parseUrlParams = (url: unknown) => {
            if (typeof url !== 'string' || !url) return null

            const searchParams = new URL(url, location.href).searchParams
            const entries = Array.from(searchParams.entries())

            if (!entries.length) return null

            return entries.reduce<Record<string, string | string[]>>((result, [key, value]) => {
              const currentValue = result[key]
              if (currentValue === undefined) {
                result[key] = value
                return result
              }
              result[key] = Array.isArray(currentValue) ? [...currentValue, value] : [currentValue, value]
              return result
            }, {})
          }

          const body =
            method === 'get'
              ? (options.params ?? parseUrlParams(options.url || response?.url) ?? options.data)
              : options.data
          try {
            if (body instanceof FormData) {
              const obj = {}
              body.forEach((value, key) => {
                obj[key] = value instanceof File ? `[File: ${value.name}]` : value
              })
              requestData = JSON.stringify(obj)
            } else if (typeof body === 'object') {
              requestData = JSON.stringify(body)
            } else {
              requestData = body == null ? '' : String(body)
            }

            requestData = normalizeJsonText(requestData)

            if (response) {
              if (typeof response.clone === 'function') {
                const clone = response.clone()
                responseText = await clone.text()
              } else if (response.responseText) {
                responseText = response.responseText
              } else if (typeof response === 'string') {
                responseText = response
              }

              responseText = normalizeJsonText(responseText)
            }
          } catch (e) {
            requestData = '解析出错'
          }

          const apiErrorCategory = getApiErrorCategory(response, error)
          const apiErrorMessage = getApiErrorMessage(responseText, response, error)
          const apiStatus = typeof response?.status === 'number' ? response.status : -1
          const apiStatusText = response?.statusText == null ? '' : String(response.statusText)
          const apiErrorName = getErrorLikeValue(error, 'name')
          const apiErrorCode = getErrorLikeValue(error, 'code')

          return {
            success: error || (response && response.status >= 400) ? 0 : 1,

            snapshots: JSON.stringify({
              reqHeaders: JSON.stringify(options.headers),
            }),

            properties: {
              api_type: body instanceof FormData ? 'form-data' : 'json',
              api_status: apiStatus,
              api_status_text: apiStatusText,
              api_error_category: apiErrorCategory,
              api_error_name: apiErrorName,
              api_error_code: apiErrorCode,
              api_error_message: apiErrorMessage,
              request_data: requestData.substring(0, 2000),
              response: responseText.substring(0, 2000),
            },
          }
        },
      }

      // 1. 将配置挂载到全局变量 __rum
      window['__rum'] = config

      // 2. 动态创建并插入 SDK 脚本
      const script = document.createElement('script')
      script.src = 'https://sdk.rum.aliyuncs.com/v2/browser-sdk.js'
      script.crossOrigin = 'anonymous'

      // 3. 插入到 DOM 中（通常插入到 head 的最前面以尽早监控）
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }
    })()
  } catch (error) {
    console.error('ARMS RUM 初始化失败:', error)
  }
}
