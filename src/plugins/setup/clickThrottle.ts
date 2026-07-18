import './clickThrottle.css'

const clickRecord = new WeakMap<HTMLElement, number>()
const DEFAULT_DELAY = 600
const LOCK_CLASS = 'base-click-throttle-locked'

window.addEventListener(
  'click',
  (e) => {
    const target = (e.target as HTMLElement).closest('[btn], [btn3d]') as HTMLElement

    if (!target) return

    if (getComputedStyle(target).pointerEvents === 'none') {
      e.stopImmediatePropagation()
      e.preventDefault()
      return
    }

    const delay = DEFAULT_DELAY
    const lastClickTime = clickRecord.get(target) || 0
    const now = Date.now()

    if (now - lastClickTime < delay) {
      e.stopImmediatePropagation()
      e.preventDefault()
    } else {
      clickRecord.set(target, now)
      target.classList.add(LOCK_CLASS)
      window.setTimeout(() => {
        target.classList.remove(LOCK_CLASS)
      }, delay)
    }
  },
  true,
)
