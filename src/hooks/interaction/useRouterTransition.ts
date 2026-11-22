import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function useRouteTransition(transitionName: RouteTransitionNames = 'slide') {
  const name = ref('none')
  const route = useRoute()
  watch(
    () => route.meta,
    (to, from) => {
      if (to.transitionName) return (name.value = to.transitionName)

      const toMetaIndex = to.index
      const fromMetaIndex = from.index

      if (
        transitionName === 'none' ||
        toMetaIndex === undefined ||
        fromMetaIndex === undefined ||
        toMetaIndex === fromMetaIndex
      ) {
        name.value = 'none'
      } else {
        name.value = transitionName + (toMetaIndex > fromMetaIndex ? '-right' : '-left')
      }
    },
  )

  return { name }
}
