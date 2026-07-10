import type { App, DirectiveBinding } from 'vue'

const LONG_PRESS_KEY = Symbol('longPress')

interface LongPressElement extends HTMLElement {
  [LONG_PRESS_KEY]?: {
    onStart: () => void
    onEnd: () => void
  }
}

export function registerDirective(app: App<Element>) {
  app.directive('focus', (el: HTMLElement) => el.focus())

  app.directive('long-press', {
    mounted(el: LongPressElement, binding: DirectiveBinding) {
      let timer: ReturnType<typeof setTimeout> | null = null

      const onStart = () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(
          () => {
            binding.value?.()
          },
          +(binding?.arg || 1000),
        )
      }

      const onEnd = () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      }

      el[LONG_PRESS_KEY] = { onStart, onEnd }
      el.addEventListener('touchstart', onStart)
      el.addEventListener('touchend', onEnd)
      el.addEventListener('touchcancel', onEnd)
    },

    unmounted(el: LongPressElement) {
      const handlers = el[LONG_PRESS_KEY]
      if (handlers) {
        handlers.onEnd()
        el.removeEventListener('touchstart', handlers.onStart)
        el.removeEventListener('touchend', handlers.onEnd)
        el.removeEventListener('touchcancel', handlers.onEnd)
        delete el[LONG_PRESS_KEY]
      }
    },
  })
}
