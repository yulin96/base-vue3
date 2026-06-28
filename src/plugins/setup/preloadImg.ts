import { useIdleLoading } from '@/hooks/state/useIdleLoading'
import { nextTick, onMounted } from 'vue'

export function setupPreloadImg() {
  const { start } = useIdleLoading(window.IMG_RESOURCES ?? [])
  async function preloadImg() {
    if (document.readyState !== 'complete') return
    document.removeEventListener('readystatechange', preloadImg)

    await nextTick()
    start()
  }

  onMounted(() => {
    if (document.readyState === 'complete') preloadImg()
    else document.addEventListener('readystatechange', preloadImg)
  })
}
