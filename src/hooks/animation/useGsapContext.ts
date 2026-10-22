import gsap from 'gsap'
import { onMounted, onUnmounted } from 'vue'

export function useGsapContext(scope: string, setup: (context: gsap.Context) => void | (() => void)) {
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
  onUnmounted(() => {
    clear()
  })

  return { clear, init }
}
