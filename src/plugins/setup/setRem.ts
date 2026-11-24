import '@/assets/styles/pc.css'
import { debounce } from 'es-toolkit'

import { createQRCode, removeQRCode } from '@/utils/dom/createQRCode'

const desktopInput = window.matchMedia('(hover: hover) and (pointer: fine)')
type ViewportSize = { width: number; height: number }

let appSize: ViewportSize | null = null
let focusSize: ViewportSize | null = null
let keyboardOpen = false
let screenSize = ''

function hasEditableFocus() {
  const element = document.activeElement
  if (element instanceof HTMLTextAreaElement) return !element.readOnly && !element.disabled
  if (element instanceof HTMLInputElement) {
    return (
      !element.readOnly &&
      !element.disabled &&
      element.inputMode !== 'none' &&
      ['text', 'search', 'tel', 'url', 'email', 'password', 'number'].includes(element.type)
    )
  }
  return element instanceof HTMLElement && element.isContentEditable
}

function getAppSize() {
  const viewport = window.visualViewport
  const height =
    !desktopInput.matches && viewport && Math.abs(viewport.scale - 1) < 0.01
      ? Math.min(innerHeight, viewport.height)
      : innerHeight
  const currentScreen = `${window.screen.width}:${window.screen.height}:${window.screen.orientation?.angle}`
  if (screenSize !== currentScreen) {
    appSize = null
    focusSize = null
    keyboardOpen = false
    screenSize = currentScreen
  }

  const editable = hasEditableFocus()
  const baseline = focusSize || appSize
  const keyboardShrink = baseline && baseline.height - height > Math.max(150, baseline.height * 0.2)

  // 键盘可能同时改变宽高，先保留输入前的整组尺寸，再判断布局。
  if (!desktopInput.matches && baseline && (editable || keyboardOpen) && keyboardShrink) {
    keyboardOpen = true
    return baseline
  }

  keyboardOpen = false
  appSize = { width: innerWidth, height }
  focusSize = editable ? appSize : null
  return appSize
}

function setRem() {
  const baseSize = 10
  const designWidth = 750
  const { width, height } = getAppSize()
  const centered = (desktopInput.matches && width > 700) || Math.min(width, height) >= 600
  const deviceWidth = centered ? Math.min(width, (375 / 720) * height) : width
  const app = document.querySelector('#app') as HTMLDivElement | null

  document.documentElement.style.setProperty('--app-height', `${height}px`)

  if (app) {
    app.style.width = centered || keyboardOpen ? `${deviceWidth}px` : ''
    app.style.height = centered ? `${height}px` : ''
    app.classList.toggle('pc', centered)
  }

  if (app && centered && desktopInput.matches && width >= 1000) {
    createQRCode(app)
  } else {
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

const scheduleSetRem = debounce(setRem, 100)
window.addEventListener('resize', scheduleSetRem)
window.visualViewport?.addEventListener('resize', scheduleSetRem)
document.addEventListener('focusin', () => {
  if (hasEditableFocus() && !keyboardOpen) focusSize = appSize
})
document.addEventListener('focusout', scheduleSetRem)

const resetViewport = () => {
  appSize = null
  focusSize = null
  keyboardOpen = false
  scheduleSetRem()
}
if (window.screen.orientation) {
  window.screen.orientation.addEventListener('change', resetViewport)
} else {
  window.addEventListener('orientationchange', resetViewport)
}
if (desktopInput.addEventListener) {
  desktopInput.addEventListener('change', scheduleSetRem)
} else {
  desktopInput.addListener(scheduleSetRem)
}
