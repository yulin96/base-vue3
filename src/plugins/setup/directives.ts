import type { App, DirectiveBinding } from 'vue'

const LONG_PRESS_KEY = Symbol('longPress')

interface LongPressElement extends HTMLElement {
  [LONG_PRESS_KEY]?: {
    onStart: (event: TouchEvent) => void
    onMove: (event: TouchEvent) => void
    onEnd: () => void
    updateCallback: (value: unknown) => void
  }
}

const LONG_PRESS_MOVE_THRESHOLD = 10

export function registerDirective(app: App<Element>) {
  app.directive('focus', (el: HTMLElement) => el.focus())

  app.directive('long-press', {
    mounted(el: LongPressElement, binding: DirectiveBinding) {
      let timer: ReturnType<typeof setTimeout> | null = null
      let startTouch: { identifier: number; x: number; y: number } | null = null
      let callback = binding.value as (() => void) | undefined

      const onEnd = () => {
        if (timer !== null) {
          clearTimeout(timer)
          timer = null
        }
        startTouch = null
      }

      const onStart = (event: TouchEvent) => {
        onEnd()
        if (event.touches.length !== 1) return

        const touch = event.changedTouches[0]
        if (!touch) return

        startTouch = { identifier: touch.identifier, x: touch.clientX, y: touch.clientY }
        timer = setTimeout(
          () => {
            timer = null
            callback?.()
          },
          +(binding?.arg || 1000),
        )
      }

      const onMove = (event: TouchEvent) => {
        if (timer === null || !startTouch) return

        let touch: Touch | undefined
        for (let index = 0; index < event.touches.length; index++) {
          const currentTouch = event.touches[index]
          if (currentTouch?.identifier === startTouch.identifier) {
            touch = currentTouch
            break
          }
        }

        if (
          !touch ||
          Math.hypot(touch.clientX - startTouch.x, touch.clientY - startTouch.y) > LONG_PRESS_MOVE_THRESHOLD
        ) {
          onEnd()
        }
      }

      const updateCallback = (value: unknown) => {
        callback = typeof value === 'function' ? (value as () => void) : undefined
      }

      el[LONG_PRESS_KEY] = { onStart, onMove, onEnd, updateCallback }
      el.addEventListener('touchstart', onStart)
      el.addEventListener('touchmove', onMove, { passive: true })
      el.addEventListener('touchend', onEnd)
      el.addEventListener('touchcancel', onEnd)
    },

    updated(el: LongPressElement, binding: DirectiveBinding) {
      el[LONG_PRESS_KEY]?.updateCallback(binding.value)
    },

    unmounted(el: LongPressElement) {
      const handlers = el[LONG_PRESS_KEY]
      if (handlers) {
        handlers.onEnd()
        el.removeEventListener('touchstart', handlers.onStart)
        el.removeEventListener('touchmove', handlers.onMove)
        el.removeEventListener('touchend', handlers.onEnd)
        el.removeEventListener('touchcancel', handlers.onEnd)
        delete el[LONG_PRESS_KEY]
      }
    },
  })
}
