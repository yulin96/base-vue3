import '@/shared/setup/gsap'

import { registerDirective } from '@/shared/directive'
import '@vant/touch-emulator'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'

import '@/shared/setup/clickRecord'
import '@/shared/setup/dev'
import '@/shared/setup/resetWxFontSize'
import '@/shared/setup/setRem'
import '@/shared/setup/showShareImage'

// import i18n from '@/lang'
import App from './App.vue'
import router from './router'

import '@/assets/styles/main.css'

window.document.documentElement.style.setProperty('--main-color', import.meta.env.VITE_APP_MAIN_COLOR)

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

app.mount('#app')
