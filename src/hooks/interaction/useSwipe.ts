import { nanoid } from 'nanoid'
import { isRef, useTemplateRef, watch, type TemplateRef } from 'vue'

export function useSwipe(onSwipe?: (dir: 'left' | 'right') => void, originKey?: string | TemplateRef<HTMLElement>) {
  const key = typeof originKey === 'string' ? originKey : `dom-${nanoid()}`

  const dom = isRef(originKey) ? originKey : useTemplateRef<HTMLElement>(key)

  let startX = 0
  let startY = 0
  let tracking = false

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    tracking = Boolean(touch)
    startX = touch?.clientX ?? 0
    startY = touch?.clientY ?? 0
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!tracking) return
    tracking = false
    const touch = e.changedTouches[0]
    if (!touch) return
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      onSwipe?.(deltaX > 0 ? 'right' : 'left')
    }
  }

  const handleTouchCancel = () => {
    tracking = false
  }

  watch(
    dom,
    (element, _, onCleanup) => {
      if (!element) return
      element.addEventListener('touchstart', handleTouchStart)
      element.addEventListener('touchend', handleTouchEnd)
      element.addEventListener('touchcancel', handleTouchCancel)
      onCleanup(() => {
        tracking = false
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchend', handleTouchEnd)
        element.removeEventListener('touchcancel', handleTouchCancel)
      })
    },
    { immediate: true, flush: 'post' },
  )

  return { key }
}
