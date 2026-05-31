import { onActivated, onDeactivated, onMounted, onUnmounted, readonly, ref } from 'vue'

export function useActive() {
  const active = ref(false)

  onMounted(() => {
    active.value = true
  })

  onUnmounted(() => {
    active.value = false
  })

  onActivated(() => {
    active.value = true
  })

  onDeactivated(() => {
    active.value = false
  })

  return readonly(active)
}
