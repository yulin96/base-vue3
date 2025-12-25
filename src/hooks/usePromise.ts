import { readonly, shallowRef, type Ref } from 'vue'

export interface UsePromiseReturn<T> {
  promise: Ref<Promise<T>>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
  isPending: Readonly<Ref<boolean>>
  isResolved: Readonly<Ref<boolean>>
  isRejected: Readonly<Ref<boolean>>
  reset: () => void
}

export function usePromise<T = unknown>(): UsePromiseReturn<T> {
  const isPending = shallowRef(true)
  const isResolved = shallowRef(false)
  const isRejected = shallowRef(false)
  const promise = shallowRef<Promise<T>>(null as any)

  let _resolve: (value: T | PromiseLike<T>) => void
  let _reject: (reason?: any) => void

  const init = () => {
    isPending.value = true
    isResolved.value = false
    isRejected.value = false

    promise.value = new Promise<T>((res, rej) => {
      _resolve = (value) => {
        if (!isPending.value) return
        isPending.value = false
        isResolved.value = true
        res(value)
        init()
      }

      _reject = (reason) => {
        if (!isPending.value) return
        isPending.value = false
        isRejected.value = true
        rej(reason)
        init()
      }
    })
  }

  init()

  return {
    promise,
    resolve: (v) => _resolve(v),
    reject: (r) => _reject(r),
    isPending: readonly(isPending),
    isResolved: readonly(isResolved),
    isRejected: readonly(isRejected),
    reset: init,
  }
}
