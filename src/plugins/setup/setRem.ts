import '@/assets/styles/pc.css'
import { createQRCode, removeQRCode } from '@/utils/dom/createQRCode'
import { debounce } from 'es-toolkit'

let appWidth = 0
let appHeight = 0
let focusHeight = 0
let keyboardOpen = false

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

function getAppHeight() {
  const viewport = window.visualViewport
  const height =
    innerWidth <= 700 && viewport && Math.abs(viewport.scale - 1) < 0.01
      ? Math.min(innerHeight, viewport.height)
      : innerHeight
  const widthChanged = appWidth !== innerWidth
  const editable = hasEditableFocus()

  if (!appHeight || widthChanged || innerWidth > 700) {
    keyboardOpen = false
    focusHeight = editable ? height : 0
    appHeight = height
  } else {
    const baseline = focusHeight || appHeight
    // 高度差是 CSS 像素；结合输入焦点区分软键盘与普通浏览器工具栏。
    const keyboardShrink = baseline - height > Math.max(150, baseline * 0.2)
    if ((editable || keyboardOpen) && keyboardShrink) {
      keyboardOpen = true
      appHeight = baseline
    } else {
      keyboardOpen = false
      appHeight = height
      if (!editable) focusHeight = 0
      else if (height >= baseline) focusHeight = height
    }
  }
  appWidth = innerWidth

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

const scheduleSetRem = debounce(setRem, 100)
window.addEventListener('resize', scheduleSetRem)
window.visualViewport?.addEventListener('resize', scheduleSetRem)
document.addEventListener('focusin', () => {
  if (hasEditableFocus() && !focusHeight && !keyboardOpen) focusHeight = appHeight
})
document.addEventListener('focusout', scheduleSetRem)
