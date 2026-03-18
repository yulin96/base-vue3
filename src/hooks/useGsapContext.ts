import { sleep } from '@/utils/common'
import gsap from 'gsap'
import { onDeactivated, onMounted, onUnmounted } from 'vue'

export function useGsapContext(scope: string, setup: () => void) {
  let ctx: gsap.Context | null = null

  const clear = async () => {
    const currentContext = ctx
    if (!currentContext) return

    ctx = null
    await sleep(360)
    currentContext.revert()
  }

  const init = () => {
    if (ctx) return
    ctx = gsap.context(setup, scope)
  }

  onMounted(init)
  // onActivated(init)
  onDeactivated(clear)
  onUnmounted(() => {
    void clear()
  })

  return { clear, init }
}
