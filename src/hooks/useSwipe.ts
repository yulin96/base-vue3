import { v4 } from 'uuid'
import { isRef, onBeforeUnmount, onMounted, useTemplateRef, type TemplateRef } from 'vue'

export function useSwipe(onSwipe?: (dir: 'left' | 'right') => void, originKey?: string | TemplateRef<HTMLElement>) {
  const key = `dom-${v4()}`

  const dom = isRef(originKey) ? originKey : useTemplateRef<HTMLElement>(originKey || key)

  let startX = 0

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX
  }

  const handleTouchEnd = (e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - startX
    if (Math.abs(deltaX) > 50) {
      onSwipe?.(deltaX > 0 ? 'right' : 'left')
    }
  }

  onMounted(() => {
    if (!dom.value) return
    dom.value?.addEventListener('touchstart', handleTouchStart)
    dom.value?.addEventListener('touchend', handleTouchEnd)
  })

  onBeforeUnmount(() => {
    dom.value?.removeEventListener('touchstart', handleTouchStart)
    dom.value?.removeEventListener('touchend', handleTouchEnd)
  })

  return { key }
}
