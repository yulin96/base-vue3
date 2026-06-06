import './buttonHaptic.css'

const VOID_ELEMENTS = new Set([
  'AREA',
  'BASE',
  'BR',
  'COL',
  'EMBED',
  'HR',
  'IMG',
  'INPUT',
  'LINK',
  'META',
  'SOURCE',
  'TRACK',
  'WBR',
])
const ANDROID_HAPTIC_DURATION = 10
let isButtonHapticSetup = false

const isAndroid = () => /Android/i.test(navigator.userAgent)

export function triggerButtonHaptic() {
  if (!isAndroid() || !navigator.vibrate) return false
  return navigator.vibrate(ANDROID_HAPTIC_DURATION)
}

const addIOSHapticSwitch = (button: HTMLElement) => {
  if (button.dataset.hapticReady === 'true' || VOID_ELEMENTS.has(button.tagName)) return

  const clip = document.createElement('span')
  clip.className = 'btn-haptic-clip'

  const hapticSwitch = document.createElement('input')
  hapticSwitch.className = 'btn-haptic-switch'
  hapticSwitch.type = 'checkbox'
  hapticSwitch.setAttribute('switch', '')
  hapticSwitch.setAttribute('aria-label', button.getAttribute('aria-label') || button.textContent?.trim() || '按钮')

  clip.append(hapticSwitch)
  button.append(clip)
  if (getComputedStyle(button).position === 'static') button.classList.add('btn-haptic-host')
  button.dataset.hapticReady = 'true'
}

const setupButtons = (root: ParentNode) => {
  if (root instanceof HTMLElement && root.hasAttribute('btn')) addIOSHapticSwitch(root)
  root.querySelectorAll<HTMLElement>('[btn]').forEach(addIOSHapticSwitch)
}

export function setupButtonHaptic() {
  if (isButtonHapticSetup) return
  isButtonHapticSetup = true

  setupButtons(document)

  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLElement>('[btn]')
    if (button && button.dataset.disabled !== 'true') triggerButtonHaptic()
  })

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) setupButtons(node)
      })
    })
  }).observe(document.documentElement, { childList: true, subtree: true })
}
