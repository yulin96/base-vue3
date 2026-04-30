import '@/assets/styles/pc.css'
import { createQRCode, removeQRCode } from '@/plugins/createQRCode'
import { debounce } from 'es-toolkit'

function setRem() {
  const baseSize = 10
  const designWidth = 750
  let deviceWidth = innerWidth

  if (innerWidth > 700) {
    const calcHeight = innerHeight
    const calcWidth = (375 / 720) * calcHeight

    const app = document.querySelector('#app') as HTMLDivElement
    app.style.width = `${calcWidth}px`
    app.style.height = `${calcHeight}px`

    deviceWidth = calcWidth

    if (app) {
      app.classList.add('pc')
      innerWidth >= 1000 ? createQRCode(app) : removeQRCode()
    }
  } else {
    const app = document.querySelector('#app') as HTMLDivElement
    if (app) {
      app.classList.remove('pc')
      app.setAttribute('style', '')
    }
    removeQRCode()
  }

  const scale = deviceWidth / designWidth

  document.documentElement.style.fontSize = `${baseSize * scale}px`
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setRem)
} else {
  setRem()
}

let lastDeviceWidth: number | null = null
window.addEventListener(
  'resize',
  debounce(() => {
    const newWidth = innerWidth
    if (lastDeviceWidth == null || Math.abs(newWidth - lastDeviceWidth) > 0.5) {
      setRem()
      lastDeviceWidth = newWidth
    }
  }, 100),
)
