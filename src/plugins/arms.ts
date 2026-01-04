export function registerARMS() {
  console.log('dd')
  ;(function () {
    const config = {
      // 上报地址及服务标识
      endpoint: __ARMSEndpoint,

      // 环境配置：'prod' | 'gray' | 'pre' | 'daily' | 'local'
      env: 'prod',

      // 路由模式：'history' | 'hash'
      spaMode: 'hash',

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
}
