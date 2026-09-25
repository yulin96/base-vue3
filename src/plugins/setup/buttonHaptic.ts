import './buttonHaptic.css'

import { getIOSVersion, isIOS } from '@/utils/platform/ua'

const HAPTIC_SELECTOR = '[tap]'
const HAPTIC_DURATION = 10
const IOS_SWITCH_MIN_VERSION = 18
const IOS_SWITCH_ID = 'base-button-haptic-switch'
let isButtonHapticSetup = false

export function triggerButtonHaptic(pattern: number | number[] = HAPTIC_DURATION) {
  if (typeof navigator.vibrate !== 'function') return false
  return navigator.vibrate(pattern)
}

const addIOSHapticSwitch = (button: HTMLElement) => {
  if (button.dataset.hapticReady === 'true' || button.matches('input, img')) return

  button.classList.add('btn-haptic-host')

  const hapticLabel = document.createElement('label')
  hapticLabel.className = 'btn-haptic-trigger'
  hapticLabel.htmlFor = IOS_SWITCH_ID
  hapticLabel.setAttribute('aria-hidden', 'true')

  button.appendChild(hapticLabel)
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

  const hapticSwitch = document.createElement('input')
  hapticSwitch.id = IOS_SWITCH_ID
  hapticSwitch.className = 'btn-haptic-switch'
  hapticSwitch.type = 'checkbox'
  hapticSwitch.tabIndex = -1
  hapticSwitch.setAttribute('switch', '')
  hapticSwitch.setAttribute('aria-hidden', 'true')
  document.body.appendChild(hapticSwitch)

  setupIOSButtons(document)
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) setupIOSButtons(node)
      })
    })
  }).observe(document.documentElement, { childList: true, subtree: true })
}
