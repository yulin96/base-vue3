import { useIdleLoading } from '@/hooks/state/useIdleLoading'
import { onBeforeUnmount, onMounted } from 'vue'

export function setupPreloadImg() {
  const { start } = useIdleLoading(window.IMG_RESOURCES ?? [])
  function preloadImg() {
    if (document.readyState !== 'complete') return
    document.removeEventListener('readystatechange', preloadImg)

    start()
  }

  onBeforeUnmount(() => document.removeEventListener('readystatechange', preloadImg))

  onMounted(() => {
    if (document.readyState === 'complete') preloadImg()
    else document.addEventListener('readystatechange', preloadImg)
  })
}
