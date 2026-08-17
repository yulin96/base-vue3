import { nanoid } from 'nanoid'
import { nextTick, onActivated, onBeforeUnmount, onDeactivated, useTemplateRef } from 'vue'

export function useRecordingLocation(initialKey?: string) {
  const key = initialKey || nanoid()
  const moveRef = useTemplateRef<HTMLElement>(key)

  let top = 0
  let active = false
  const animationFrameIds = new Set<number>()

  const clearScheduledRestore = () => {
    animationFrameIds.forEach((id) => cancelAnimationFrame(id))
    animationFrameIds.clear()
  }

  const scheduleRestore = (callback: () => void) => {
    const id = requestAnimationFrame(() => {
      animationFrameIds.delete(id)
      if (active) callback()
    })
    animationFrameIds.add(id)
  }

  const restoreTop = () => {
    if (!moveRef.value) return
    moveRef.value.scrollTop = top
  }

  onActivated(() => {
    active = true
    clearScheduledRestore()
    void nextTick(() => {
      if (!active) return
      restoreTop()

      scheduleRestore(() => {
        restoreTop()
        scheduleRestore(() => {
          restoreTop()
        })
      })
    })
  })

  onDeactivated(() => {
    active = false
    clearScheduledRestore()
    top = moveRef.value?.scrollTop || 0
  })

  onBeforeUnmount(() => {
    active = false
    clearScheduledRestore()
  })

  return { key }
}
