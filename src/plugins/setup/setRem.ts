import '@/assets/styles/pc.css'
import { createQRCode, removeQRCode } from '@/utils/dom/createQRCode'
import { debounce } from 'es-toolkit'

let appWidth = 0
let appHeight = 0

function getAppHeight() {
  if (!appHeight || appWidth !== innerWidth || innerHeight > appHeight) {
    appWidth = innerWidth
    appHeight = innerHeight
  }

  return appHeight
}

function setRem() {
  const baseSize = 10
  const designWidth = 750
  const appHeight = getAppHeight()
  let deviceWidth = innerWidth
  const app = document.querySelector('#app') as HTMLDivElement | null

  document.documentElement.style.setProperty('--app-height', `${appHeight}px`)

  if (innerWidth > 700) {
    const calcHeight = appHeight
    const calcWidth = (375 / 720) * calcHeight

    if (app) {
      app.style.width = `${calcWidth}px`
      app.style.height = `${calcHeight}px`
      app.classList.add('pc')
      innerWidth >= 1000 ? createQRCode(app) : removeQRCode()
    }

    deviceWidth = calcWidth
  } else {
    if (app) {
      app.classList.remove('pc')
      app.style.width = ''
      app.style.height = ''
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

window.addEventListener(
  'resize',
  debounce(() => {
    setRem()
  }, 100),
)
