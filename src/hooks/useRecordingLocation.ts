import { v4 } from 'uuid'
import { nextTick, onActivated, onDeactivated, useTemplateRef } from 'vue'

export function useRecordingLocation(initialKey?: string) {
  const key = initialKey || v4()
  const moveRef = useTemplateRef<HTMLElement>(key)

  let top = 0

  const restoreTop = () => {
    if (!moveRef.value) return
    moveRef.value.scrollTop = top
  }

  onActivated(() => {
    void nextTick(() => {
      restoreTop()

      requestAnimationFrame(() => {
        restoreTop()
        requestAnimationFrame(() => {
          restoreTop()
        })
      })
    })
  })

  onDeactivated(() => {
    top = moveRef.value?.scrollTop || 0
  })

  return { key }
}
