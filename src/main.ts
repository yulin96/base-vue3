import '@/assets/styles/main.css'
import '@/plugins/appInit'

import { prodModel } from '@/config/env'
import { registerARMS } from '@/plugins/arms'
import { registerDirective } from '@/plugins/directives'
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
  prodModel && registerARMS()
})
