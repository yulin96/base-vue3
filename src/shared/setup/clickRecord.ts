const clickRecord = new WeakMap()
const DEFAULT_DELAY = 900

window.addEventListener(
  'click',
  (e) => {
    const target = (e.target as HTMLElement).closest('[btn]') as HTMLElement

    if (!target) return

    if (getComputedStyle(target).pointerEvents === 'none') {
      e.stopImmediatePropagation()
      e.preventDefault()
      return
    }

    const delay = DEFAULT_DELAY
    const lastClickTime = clickRecord.get(target) || 0
    const now = Date.now()

    console.log(target, target.style.pointerEvents)

    if (now - lastClickTime < delay) {
      e.stopImmediatePropagation()
      e.preventDefault()
    } else {
      clickRecord.set(target, now)
      target.style.pointerEvents = 'none'
      setTimeout(() => {
        target.style.pointerEvents = 'auto'
      }, delay)
    }
  },
  true,
)
