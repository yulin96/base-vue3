import '@/assets/styles/main.css'
import '@/plugins/appInit'

import { prodModel } from '@/config/env'
import { registerARMS } from '@/plugins/monitoring/arms'
import { registerDirective } from '@/plugins/setup/directives'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// import i18n from '@/locales'

const app = createApp(App)

registerDirective(app)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// app.use(i18n)
app.use(pinia)
app.use(router)

app.mount('#app').$nextTick(() => {
  prodModel && import.meta.env.VITE_APP_ARMS == '1' && registerARMS()
})
