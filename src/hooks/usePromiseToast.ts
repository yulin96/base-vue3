import { usePromise } from '@/hooks/usePromise'
import { shallowRef } from 'vue'
import { toast } from 'vue-sonner'

export const usePromiseToast = () => {
  const { promise, resolve, reject, reset } = usePromise<string>()

  const isBusy = shallowRef(false)

  const createToast = (message?: string) => {
    isBusy.value = true
    toast.promise(promise.value, {
      loading: message || '处理中...',
      success: (value: string) => value,
      error: (value: string) => value,
      finally() {
        isBusy.value = false
        reset()
      },
    })
  }

  return {
    isBusy,
    createToast,
    resolveToast: (v = '处理成功！') => resolve(v),
    rejectToast: (e = '处理失败！') => reject(e),
  }
}
