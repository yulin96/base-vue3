import './buttonHaptic.css'

import { getIOSVersion, isIOS } from '@/utils/platform/ua'

const HAPTIC_SELECTOR = '[tap]'
const HAPTIC_DURATION = 10
const IOS_SWITCH_MIN_VERSION = 18
let isButtonHapticSetup = false

export function triggerButtonHaptic(pattern: number | number[] = HAPTIC_DURATION) {
  if (typeof navigator.vibrate !== 'function') return false
  return navigator.vibrate(pattern)
}

const addIOSHapticSwitch = (button: HTMLElement) => {
  if (button.dataset.hapticReady === 'true' || button.matches('input, img')) return

  button.classList.add('btn-haptic-host')

  const hapticSwitch = document.createElement('input')
  hapticSwitch.className = 'btn-haptic-switch'
  hapticSwitch.type = 'checkbox'
  hapticSwitch.setAttribute('switch', '')
  hapticSwitch.setAttribute('aria-label', button.getAttribute('aria-label') || button.textContent?.trim() || '按钮')

  button.appendChild(hapticSwitch)
  button.dataset.hapticReady = 'true'
}

const setupIOSButtons = (root: ParentNode) => {
  if (root instanceof HTMLElement && root.matches(HAPTIC_SELECTOR)) addIOSHapticSwitch(root)
  root.querySelectorAll<HTMLElement>(HAPTIC_SELECTOR).forEach(addIOSHapticSwitch)
}

export function setupButtonHaptic() {
  if (isButtonHapticSetup) return
  isButtonHapticSetup = true

  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLElement>(HAPTIC_SELECTOR)
    if (button && button.dataset.disabled !== 'true') triggerButtonHaptic()
  })

  if (!isIOS() || (getIOSVersion() ?? 0) < IOS_SWITCH_MIN_VERSION) return

  setupIOSButtons(document)
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) setupIOSButtons(node)
      })
    })
  }).observe(document.documentElement, { childList: true, subtree: true })
}
