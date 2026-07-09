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
const TAP_MOVE_LIMIT = 10
const POSITION_CLASSES = new Set(['relative', 'absolute', 'fixed', 'sticky'])
let isButtonHapticSetup = false

const isAndroid = () => /Android/i.test(navigator.userAgent)

const hasPositionClass = (button: HTMLElement) =>
  [...button.classList].some((className) => POSITION_CLASSES.has(className.replace(/!$/, '')))

export function triggerButtonHaptic() {
  if (!isAndroid() || !navigator.vibrate) return false
  return navigator.vibrate(ANDROID_HAPTIC_DURATION)
}

const addIOSHapticSwitch = (button: HTMLElement) => {
  if (button.dataset.hapticReady === 'true' || VOID_ELEMENTS.has(button.tagName)) return

  const position = getComputedStyle(button).position
  if (!hasPositionClass(button) && !POSITION_CLASSES.has(position)) {
    button.dataset.hapticHost = 'true'
    button.classList.add('relative')
  }

  const clip = document.createElement('span')
  clip.className = 'btn-haptic-clip'

  let startPoint: { x: number; y: number } | null = null
  let isMoved = false
  let resetTimer: number | undefined

  clip.addEventListener('pointerdown', (event) => {
    window.clearTimeout(resetTimer)
    startPoint = { x: event.clientX, y: event.clientY }
    isMoved = false
  })

  clip.addEventListener('pointermove', (event) => {
    if (!startPoint) return
    const diffX = Math.abs(event.clientX - startPoint.x)
    const diffY = Math.abs(event.clientY - startPoint.y)
    if (diffX > TAP_MOVE_LIMIT || diffY > TAP_MOVE_LIMIT) isMoved = true
  })

  const resetMoveState = () => {
    startPoint = null
    resetTimer = window.setTimeout(() => {
      isMoved = false
    }, 120)
  }

  clip.addEventListener('pointerup', resetMoveState)
  clip.addEventListener('pointercancel', resetMoveState)
  clip.addEventListener('click', (event) => {
    if (!isMoved) return
    event.stopPropagation()
    event.preventDefault()
  })

  const hapticSwitch = document.createElement('input')
  hapticSwitch.className = 'btn-haptic-switch'
  hapticSwitch.type = 'checkbox'
  hapticSwitch.setAttribute('switch', '')
  hapticSwitch.setAttribute('aria-label', button.getAttribute('aria-label') || button.textContent?.trim() || '按钮')

  clip.append(hapticSwitch)
  button.append(clip)
  button.dataset.hapticReady = 'true'
}

const setupButtons = (root: ParentNode) => {
  if (root instanceof HTMLElement && root.hasAttribute('tap')) addIOSHapticSwitch(root)
  root.querySelectorAll<HTMLElement>('[tap]').forEach(addIOSHapticSwitch)
}

export function setupButtonHaptic() {
  if (isButtonHapticSetup) return
  isButtonHapticSetup = true

  setupButtons(document)

  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLElement>('[tap]')
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
