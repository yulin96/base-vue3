import { nanoid } from 'nanoid'
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, useTemplateRef } from 'vue'

interface ISlideOptions {
  prev?: () => void
  next?: () => void
  prevScroll?: (num: number) => void
  nextScroll?: (num: number) => void
  slideNumber?: number
}

export const useSlide = ({ prev, next, prevScroll, nextScroll, slideNumber = 100 }: ISlideOptions) => {
  let touching = false
  let prevStartY: number | null = null
  let nextStartY: number | null = null

  const key = nanoid()
  const ele = useTemplateRef<HTMLElement>(key)

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
    onEnd()
    if (!touch || !ele.value) return

    touching = true
    const { scrollTop, clientHeight, scrollHeight } = ele.value
    prevStartY = scrollTop <= 0 ? touch.pageY : null
    nextStartY = scrollTop + clientHeight >= scrollHeight - 1 ? touch.pageY : null
  }

  const onMove = (event: TouchEvent) => {
    const pageY = event.touches[0]?.pageY
    if (pageY === undefined || !ele.value || !touching || lock) return

    const { scrollTop, clientHeight, scrollHeight } = ele.value
    prevStartY = scrollTop <= 0 ? (prevStartY ?? pageY) : null
    nextStartY = scrollTop + clientHeight >= scrollHeight - 1 ? (nextStartY ?? pageY) : null

    const prevDistance = prevStartY === null ? 0 : prevStartY - pageY
    const nextDistance = nextStartY === null ? 0 : nextStartY - pageY
    const distance = nextDistance > 0 ? nextDistance : prevDistance < 0 ? prevDistance : 0

    if (Math.abs(distance) > slideNumber) {
      lock = true
      if (event.cancelable) event.preventDefault()
      return distance > 0 ? next?.() : prev?.()
    }

    if (Math.abs(distance) < 20) return

    return distance > 0 ? nextScroll?.(Math.round(distance)) : prevScroll?.(Math.round(distance))
  }

  const onEnd = () => {
    touching = false
    prevStartY = null
    nextStartY = null
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
    onEnd()
  }

  onMounted(bindEvents)

  onActivated(() => {
    unbindEvents()
    bindEvents()
  })

  onBeforeUnmount(unbindEvents)

  onDeactivated(() => {
    unbindEvents()
  })

  return { key }
}
