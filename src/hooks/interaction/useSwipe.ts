import { v4 } from 'uuid'
import { isRef, onBeforeUnmount, onMounted, useTemplateRef, type TemplateRef } from 'vue'

export function useSwipe(onSwipe?: (dir: 'left' | 'right') => void, originKey?: string | TemplateRef<HTMLElement>) {
  const key = typeof originKey === 'string' ? originKey : `dom-${v4()}`

  const dom = isRef(originKey) ? originKey : useTemplateRef<HTMLElement>(key)

  let startX = 0
  let startY = 0
  let tracking = false
  let boundElement: HTMLElement | null = null

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

  onMounted(() => {
    if (!dom.value) return
    boundElement = dom.value
    boundElement.addEventListener('touchstart', handleTouchStart)
    boundElement.addEventListener('touchend', handleTouchEnd)
    boundElement.addEventListener('touchcancel', handleTouchCancel)
  })

  onBeforeUnmount(() => {
    boundElement?.removeEventListener('touchstart', handleTouchStart)
    boundElement?.removeEventListener('touchend', handleTouchEnd)
    boundElement?.removeEventListener('touchcancel', handleTouchCancel)
    boundElement = null
  })

  return { key }
}
