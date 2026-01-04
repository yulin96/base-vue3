import { shallowRef } from 'vue'
import { toast } from 'vue-sonner'

export const usePromiseToast = () => {
  const inert = shallowRef(false)

  let resolver = Promise.withResolvers<string>()
  const createToast = (message?: string) => {
    inert.value = true

    toast.promise(resolver.promise, {
      loading: message || '处理中...',
      success: (value: string) => value,
      error: (value: string) => value,
      finally() {
        inert.value = false
        reset()
      },
    })
  }

  function reset() {
    resolver = Promise.withResolvers<string>()
  }

  return {
    inert,
    createToast,
    resolveToast: (v = '处理成功！') => resolver.resolve(v),
    rejectToast: (e = '处理失败！') => resolver.reject(e),
  }
}
