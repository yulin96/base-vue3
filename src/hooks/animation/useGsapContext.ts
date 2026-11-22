import gsap from 'gsap'
import { onMounted, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue'

export function useGsapContext(
  scope: MaybeRefOrGetter<string | Element | null>,
  setup: (context: gsap.Context) => void | (() => void),
) {
  let ctx: gsap.Context | null = null

  const clear = () => {
    const currentContext = ctx
    if (!currentContext) return

    ctx = null
    currentContext.revert()
  }

  const init = () => {
    if (ctx) return
    const target = toValue(scope)
    if (target) ctx = gsap.context(setup, target)
  }

  onMounted(init)
  onUnmounted(() => {
    clear()
  })

  return { clear, init }
}
