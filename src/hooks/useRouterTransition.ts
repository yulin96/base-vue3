import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function useRouteTransition(transitionName: RouteTransitionNames = 'slide') {
  import(`@/assets/styles/transitions/${transitionName}.css`).catch((err) => {
    console.error('Error loading transition CSS:', err)
  })

  const name = ref('none')
  const route = useRoute()
  watch(
    () => route.meta,
    (to, from) => {
      if (to.transitionName) return (name.value = to.transitionName)

      const toMetaIndex = to.index || 0
      const fromMetaIndex = from.index || 0

      if (!toMetaIndex || !fromMetaIndex || toMetaIndex === fromMetaIndex) {
        name.value = 'none'
      } else {
        name.value = transitionName + (toMetaIndex > fromMetaIndex ? '-right' : '-left')
      }
    },
  )

  return { name }
}
