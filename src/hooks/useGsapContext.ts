import { sleep } from '@/utils/common'
import gsap from 'gsap'
import { onDeactivated, onMounted, onUnmounted } from 'vue'

export function useGsapContext(scope: string, setup: () => void) {
  let ctx: gsap.Context | null = null

  const clear = async () => {
    await sleep(360)
    ctx?.revert()
    ctx = null
  }

  const init = () => {
    ctx = gsap.context(setup, scope)
  }

  onMounted(init)
  // onActivated(init)
  onDeactivated(clear)
  onUnmounted(clear)

  return { clear, init }
}
