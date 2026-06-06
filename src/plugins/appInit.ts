import '@/plugins/setup/buttonEffect'
import '@/plugins/setup/clickThrottle'
import '@/plugins/setup/dev'
import '@/plugins/setup/gsap'
import '@/plugins/setup/resetWxFontSize'
import '@/plugins/setup/setRem'
import '@vant/touch-emulator'
import { setupButtonHaptic } from '@/plugins/setup/buttonHaptic'

window.document.documentElement.style.setProperty('--main-color', import.meta.env.VITE_APP_MAIN_COLOR)
setupButtonHaptic()
