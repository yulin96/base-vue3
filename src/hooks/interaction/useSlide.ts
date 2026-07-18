import { useScroll } from '@vueuse/core'
import { v4 } from 'uuid'
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useTemplateRef } from 'vue'

interface ISlideOptions {
  prev?: () => void
  next?: () => void
  prevScroll?: (num: number) => void
  nextScroll?: (num: number) => void
  slideNumber?: number
}

export const useSlide = ({ prev, next, prevScroll, nextScroll, slideNumber = 100 }: ISlideOptions) => {
  const startMove = ref({ pageY: 0, once: true })

  const key = v4()
  const ele = useTemplateRef<HTMLElement>(key)
  const { arrivedState } = useScroll(ele, { offset: { bottom: 0 } })

  let lock = false
  let boundElement: HTMLElement | null = null
  let wheelLockTimer: number | null = null

  const resetLock = () => {
    lock = false
    if (wheelLockTimer !== null) {
      clearTimeout(wheelLockTimer)
      wheelLockTimer = null
    }
  }

  const onStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    startMove.value.pageY = touch?.pageY ?? 0
    startMove.value.once = !touch
    resetLock()
  }

  const onMove = (event: TouchEvent) => {
    const pageY = event.touches[0]?.pageY
    if (pageY === undefined) return
    if (!ele.value) return
    if (arrivedState.top || arrivedState.bottom || ele.value.scrollTop < 0) {
      if (startMove.value.once) {
        startMove.value.pageY = pageY
        startMove.value.once = false
      }

      if (Math.abs(startMove.value.pageY - pageY) > slideNumber) {
        if (lock) return
        lock = true
        if (event.cancelable) {
          event.preventDefault()
        }
        return startMove.value.pageY > pageY ? next?.() : prev?.()
      }

      if (Math.abs(startMove.value.pageY - pageY) < 20) return

      if (startMove.value.pageY > pageY) {
        return nextScroll?.(Math.round(startMove.value.pageY - pageY))
      } else if (startMove.value.pageY < pageY) {
        return prevScroll?.(Math.round(startMove.value.pageY - pageY))
      }
    }
  }

  const onEnd = () => {
    startMove.value.pageY = 0
    startMove.value.once = true
    resetLock()
  }

  const eleEffect = (event: WheelEvent) => {
    if (!ele.value || lock) return

    if (event.deltaY < -60 && ele.value.scrollTop === 0) {
      lock = true
      prev?.()
    } else if (
      event.deltaY > 60 &&
      Math.ceil(ele.value.scrollTop) + Math.ceil(ele.value.clientHeight) + 2 >= ele.value.scrollHeight
    ) {
      lock = true
      next?.()
    }

    if (lock) {
      wheelLockTimer = window.setTimeout(resetLock, 300)
    }
  }

  const bindEvents = () => {
    if (!ele.value) return
    boundElement = ele.value
    boundElement.addEventListener('touchstart', onStart)
    boundElement.addEventListener('touchmove', onMove, { passive: false })
    boundElement.addEventListener('touchend', onEnd)
    boundElement.addEventListener('touchcancel', onEnd)
    boundElement.addEventListener('wheel', eleEffect)
  }

  const unbindEvents = () => {
    if (!boundElement) return
    boundElement.removeEventListener('touchstart', onStart)
    boundElement.removeEventListener('touchmove', onMove)
    boundElement.removeEventListener('touchend', onEnd)
    boundElement.removeEventListener('touchcancel', onEnd)
    boundElement.removeEventListener('wheel', eleEffect)
    boundElement = null
    resetLock()
  }

  onMounted(bindEvents)

  onActivated(() => {
    unbindEvents()
    bindEvents()
  })

  onBeforeUnmount(unbindEvents)

  onDeactivated(() => {
    startMove.value.pageY = 0
    startMove.value.once = true
    resetLock()
    unbindEvents()
  })

  return { key }
}
