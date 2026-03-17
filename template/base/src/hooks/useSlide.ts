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

  const onStart = () => {
    lock = false
  }

  const onMove = (t: any) => {
    const pageY = t?.changedTouches?.[0]?.pageY || t.pageY
    if (arrivedState.top || arrivedState.bottom || ele.value!.scrollTop < 0) {
      if (startMove.value.once) {
        startMove.value.pageY = pageY
        startMove.value.once = false
      }

      if (Math.abs(startMove.value.pageY - pageY) > slideNumber) {
        if (lock) return
        lock = true
        if (t.cancelable) {
          t.preventDefault()
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

  const onEnd = (t: any) => {
    startMove.value.pageY = 0
    startMove.value.once = true
    lock = false
  }

  const eleEffect = (t: any) => {
    if (!ele.value) return

    if (t.deltaY < -60 && ele.value.scrollTop === 0) {
      prev?.()
    }

    if (
      t.deltaY > 60 &&
      Math.ceil(ele.value.scrollTop) + Math.ceil(ele.value.clientHeight) + 2 >= ele.value.scrollHeight
    ) {
      next?.()
    }
  }

  onMounted(() => {
    if (!ele.value) return
    ele.value.addEventListener('touchstart', onStart)
    ele.value.addEventListener('touchmove', onMove)
    ele.value.addEventListener('touchend', onEnd)
    ele.value.addEventListener('wheel', eleEffect)
  })

  onActivated(() => {
    if (!ele.value) return
    ele.value.addEventListener('touchstart', onStart)
    ele.value.addEventListener('touchmove', onMove)
    ele.value.addEventListener('touchend', onEnd)
    ele.value.addEventListener('wheel', eleEffect)
  })

  onBeforeUnmount(() => {
    if (!ele.value) return
    ele.value.removeEventListener('touchstart', onStart)
    ele.value.removeEventListener('touchmove', onMove)
    ele.value.removeEventListener('touchend', onEnd)
    ele.value.removeEventListener('wheel', eleEffect)
  })

  onDeactivated(() => {
    if (!ele.value) return
    startMove.value.pageY = 0
    startMove.value.once = true
    lock = false
    ele.value.removeEventListener('touchstart', onStart)
    ele.value.removeEventListener('touchmove', onMove)
    ele.value.removeEventListener('touchend', onEnd)
    ele.value.removeEventListener('wheel', eleEffect)
  })

  return { key }
}
