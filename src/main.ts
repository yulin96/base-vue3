import '@/assets/styles/main.css'
import '@/plugins/appInit'

import { prodModel } from '@/config/env'
import { registerDirective } from '@/plugins/directives'
import armsRum from '@arms/rum-browser'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// import i18n from '@/lang'

const app = createApp(App)

registerDirective(app)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// app.use(i18n)
app.use(pinia)
app.use(router)

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

app.mount('#app').$nextTick(() => {
  prodModel &&
    armsRum.init({
      endpoint: __ARMSEndpoint,
      // 设置环境信息，参考值：'prod' | 'gray' | 'pre' | 'daily' | 'local'
      env: 'prod',
      // 设置路由模式， 参考值：'history' | 'hash'
      spaMode: 'hash',
      collectors: {
        // 页面性能指标监听开关，默认开启
        perf: true,
        // WebVitals指标监听开关，默认开启
        webVitals: true,
        // Ajax监听开关，默认开启
        api: true,
        // 静态资源开关，默认开启
        staticResource: true,
        // JS错误监听开关，默认开启
        jsError: true,
        // 控制台错误监听开关，默认开启
        consoleError: true,
        // 用户行为监听开关，默认开启
        action: true,
      },
      // 链路追踪配置开关，默认关闭
      tracing: false,
    })
})
