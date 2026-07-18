import gsap from 'gsap'
import { onMounted, onUnmounted } from 'vue'

export function useGsapContext(scope: string, setup: () => void) {
  let ctx: gsap.Context | null = null

  const clear = () => {
    const currentContext = ctx
    if (!currentContext) return

    ctx = null
    currentContext.revert()
  }

  const init = () => {
    if (ctx) return
    ctx = gsap.context(setup, scope)
  }

  onMounted(init)
  // onActivated(init)
  // onDeactivated(clear)
  onUnmounted(() => {
    clear()
  })

  return { clear, init }
}
