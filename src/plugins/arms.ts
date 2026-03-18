export function registerARMS() {
  try {
    ;(function () {
      const config = {
        // 上报地址及服务标识
        endpoint: __ARMSEndpoint,

        // 环境配置：'prod' | 'gray' | 'pre' | 'daily' | 'local'
        env: 'prod',

        // 路由模式：'history' | 'hash'
        spaMode: 'hash',

        user: {
          tags: document.title || 'unknown',
        },

        parseViewName() {
          return location.origin + location.pathname + location.hash.split('?')?.[0]
        },

        // 监控项配置
        collectors: {
          perf: true, // 页面性能指标
          webVitals: true, // WebVitals 指标
          api: true, // Ajax/Fetch 请求监听
          staticResource: true, // 静态资源加载监听
          jsError: true, // JS 运行错误监听
          consoleError: true, // 控制台 error 监听
          action: true, // 用户行为点击监听
        },

        // 链路追踪开关
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

          return {
            success: error || (response && response.status >= 400) ? 0 : 1,

            snapshots: JSON.stringify({
              reqHeaders: JSON.stringify(options.headers),
            }),

            properties: {
              api_type: body instanceof FormData ? 'form-data' : 'json',
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
