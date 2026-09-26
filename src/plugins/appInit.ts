import { electronApi } from '@/config/env'
import { initInteractionStats } from '@/utils/interactionStats'
import '@/plugins/setup/buttonEffect'
import { setupButtonHaptic } from '@/plugins/setup/buttonHaptic'
import '@/plugins/setup/clickThrottle'
import '@/plugins/setup/dev'
import '@/plugins/setup/gsap'
import '@/plugins/setup/resetWxFontSize'
import '@vant/touch-emulator'

window.document.documentElement.style.setProperty('--main-color', import.meta.env.VITE_APP_MAIN_COLOR)
setupButtonHaptic()

const title = import.meta.env.VITE_APP_TITLE
if (title) {
  document.title = title + '​'
  document.title = title
}

if (electronApi && import.meta.env.VITE_APP_STATS_PROJECT_ID?.trim()) {
  void initInteractionStats().then(({ initialized, error }) => {
    if (!initialized) console.error('统计初始化失败：', error)
  })
}
