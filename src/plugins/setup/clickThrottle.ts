const clickRecord = new WeakMap<HTMLElement, number>()
const DEFAULT_DELAY = 600

window.addEventListener(
  'click',
  (e) => {
    const target = (e.target as HTMLElement).closest('[btn], [btn3d]') as HTMLElement

    if (!target) return
    if (target.hasAttribute('ig')) return

    const delay = DEFAULT_DELAY
    const lastClickTime = clickRecord.get(target) || 0
    const now = Date.now()

    if (now - lastClickTime < delay) {
      e.stopImmediatePropagation()
      e.preventDefault()
    } else {
      clickRecord.set(target, now)
    }
  },
  true,
)
