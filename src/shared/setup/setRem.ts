import { createQRCode, removeQRCode } from '@/shared/setup/createQRCode'
import { isMobile } from '@/utils/browser/ua'
import { isPcMode } from '@/utils/validator'
import { debounce } from 'es-toolkit'
import './pc.css'

function setRem() {
  const baseSize = 10
  const designWidth = 750
  let deviceWidth = innerWidth

  if (isPcMode()) {
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
    }
    app.setAttribute('style', '')
    removeQRCode()
  }

  const scale = deviceWidth / designWidth

  document.documentElement.style.fontSize = `${baseSize * scale}px`
}

setRem()

window.addEventListener(
  'resize',
  debounce(() => {
    setRem()
  }, 100),
)

if (isMobile()) {
  const style = document.createElement('style')
  style.textContent = `*:not(input, textarea) {
  user-select: none;
}`
  document.head.appendChild(style)
}
