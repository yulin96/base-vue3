import { v4 } from 'uuid'
import { onActivated, onDeactivated, useTemplateRef } from 'vue'

export function useRecordingLocation(initialKey?: string) {
  const key = initialKey || v4()
  const moveRef = useTemplateRef<HTMLElement>(key)

  let top = 0

  onActivated(() => {
    requestAnimationFrame(() => {
      moveRef.value && (moveRef.value!.scrollTop = top)
    })
  })

  onDeactivated(() => {
    top = moveRef.value?.scrollTop || 0
  })

  return { key }
}
