import { readonly, shallowRef } from 'vue'

export function useLock(initialStatus = false) {
  const status = shallowRef(initialStatus)

  const lock = () => {
    status.value = true
  }

  const unLock = () => {
    status.value = false
  }

  return [readonly(status), lock, unLock] as const
}
