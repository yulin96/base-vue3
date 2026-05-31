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

const includesAny = (value: string, parts: string[]) => parts.some((part) => value.includes(part))

const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine

const getErrorParts = (error: unknown) => {
  if (!error || typeof error !== 'object') return null

  const err = error as { name?: string; code?: string; message?: string; type?: string }
  return {
    code: (err.code || '').toLowerCase(),
    message: (err.message || '').toLowerCase(),
    name: (err.name || '').toLowerCase(),
    type: err.type || '',
  }
}

const getResponseStatus = (response?: Response | Record<string, unknown> | null) => {
  return typeof response?.status === 'number' ? response.status : undefined
}

/**
 * 细粒度诊断网络/请求错误类型
 *
 * 返回值含义：
 * - timeout          请求超时（含连接超时和读取超时）
 * - offline          设备无网络连接
 * - dns_error        DNS 解析失败
 * - connection_refused 连接被服务器拒绝
 * - connection_reset   连接被重置
 * - ssl_error        SSL/TLS 握手或证书错误
 * - cors_error       CORS 跨域策略拦截
 * - network_change   网络切换导致中断
 * - abort            请求被中止（非主动取消）
 * - body_parse_error 响应体解析失败
 * - http_4xx         客户端错误（400-499）
 * - http_5xx         服务端错误（500+）
 * - network_error    其他网络层错误（兜底）
 * - canceled         主动取消
 * - unknown          无法归类
 * - success          请求成功
 */
const diagnoseNetworkError = (response?: Response | Record<string, unknown> | null, error?: unknown): string => {
  if (isCanceledRequest(error)) return 'canceled'

  const errorParts = getErrorParts(error)
  if (errorParts) {
    const { code, message, name, type } = errorParts

    // 超时
    if (
      code === 'econnaborted' ||
      code === 'etimedout' ||
      code === 'timeout' ||
      name === 'timeouterror' ||
      includesAny(message, ['timeout', 'timed out'])
    ) {
      return 'timeout'
    }

    // 设备离线
    if (isOffline()) {
      return 'offline'
    }

    // DNS 解析失败
    if (
      code === 'enotfound' ||
      includesAny(message, ['dns', 'getaddrinfo', 'name not resolved', 'nodename nor servname'])
    ) {
      return 'dns_error'
    }

    // 连接被拒绝
    if (code === 'econnrefused' || includesAny(message, ['connection refused'])) {
      return 'connection_refused'
    }

    // 连接被重置
    if (code === 'econnreset' || code === 'epipe' || includesAny(message, ['connection reset', 'socket hang up'])) {
      return 'connection_reset'
    }

    // SSL/TLS 错误
    if (
      includesAny(message, ['ssl', 'tls', 'certificate', 'cert', 'self signed', 'unable to verify']) ||
      code.includes('cert')
    ) {
      return 'ssl_error'
    }

    // CORS 错误 —— 浏览器 fetch/XHR 跨域失败时 status=0 且 type='opaque'/'error'
    if (
      includesAny(message, ['cors', 'cross-origin', 'access-control-allow-origin']) ||
      (type === 'error' && response && (response as Response).type === 'opaque')
    ) {
      return 'cors_error'
    }

    // 网络切换 / 中断（移动端常见）
    if (
      includesAny(message, [
        'network changed',
        'network request failed',
        'the internet connection appears to be offline',
        'a server with the specified hostname could not be found',
        'the network connection was lost',
      ]) ||
      code === 'err_internet_disconnected' ||
      code === 'err_network_changed'
    ) {
      return 'network_change'
    }

    // Abort（请求被中止，非主动取消）
    if (name === 'aborterror' || includesAny(message, ['aborted'])) {
      return 'abort'
    }

    // 响应体解析错误
    if (
      includesAny(message, ['json', 'unexpected token', 'unexpected end of', 'not valid json']) ||
      name === 'syntaxerror'
    ) {
      return 'body_parse_error'
    }

    // 网络错误（fetch 在 network failure 时 status=0，message='Network Error' / 'Failed to fetch'）
    if (
      code === 'err_network' ||
      includesAny(message, ['network error', 'failed to fetch', 'load failed', 'networkerror'])
    ) {
      // 再次确认是否离线
      if (isOffline()) return 'offline'
      return 'network_error'
    }
  }

  // HTTP 状态码级别
  const status = getResponseStatus(response)
  if (typeof status === 'number') {
    if (status === 0) return 'network_error'
    if (status >= 500) return 'http_5xx'
    if (status >= 400) return 'http_4xx'
  }

  if (error) return 'unknown'
  return 'success'
}

/**
 * 采集当前网络质量信息（Network Information API）
 * 返回一个对象，用于附加到 ARMS properties
 */
export const getNetworkQualityInfo = (): Record<string, string | number> => {
  const info: Record<string, string | number> = {}

  info.is_online = typeof navigator !== 'undefined' ? (navigator.onLine ? 'yes' : 'no') : 'unknown'

  // Navigator.connection (Network Information API)
  const conn =
    (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection
  if (conn) {
    if (conn.effectiveType) info.net_effective_type = conn.effectiveType // 'slow-2g' | '2g' | '3g' | '4g'
    if (typeof conn.downlink === 'number') info.net_downlink = conn.downlink // Mbps
    if (typeof conn.rtt === 'number') info.net_rtt = conn.rtt // ms
    if (typeof conn.saveData === 'boolean') info.net_save_data = conn.saveData ? 'yes' : 'no'
    if (conn.type) info.net_type = conn.type // 'wifi' | 'cellular' | 'ethernet' | 'none' ...
  }

  return info
}

/**
 * 针对 AxiosError 的诊断包装
 * 从 AxiosError 结构中提取 response 和原始 error，调用 diagnoseNetworkError
 */
export const diagnoseAxiosError = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'unknown'

  return diagnoseNetworkError((error as { response?: { status?: number; statusText?: string } }).response as any, error)
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

  const status = getResponseStatus(response)
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
          version: document.title || 'unknown',
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

          const apiErrorCategory = diagnoseNetworkError(response, error)
          const apiErrorMessage = getApiErrorMessage(responseText, response, error)
          const apiStatus = typeof response?.status === 'number' ? response.status : -1
          const apiStatusText = response?.statusText == null ? '' : String(response.statusText)
          const apiErrorName = getErrorLikeValue(error, 'name')
          const apiErrorCode = getErrorLikeValue(error, 'code')
          const networkInfo = apiErrorCategory !== 'success' ? getNetworkQualityInfo() : {}

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
              ...networkInfo,
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
