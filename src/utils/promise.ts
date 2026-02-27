export type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

export function createDeferred<T = void>(): Deferred<T> {
  const handlers: {
    resolve: Deferred<T>['resolve']
    reject: Deferred<T>['reject']
  } = {
    resolve: () => {},
    reject: () => {},
  }

  const promise = new Promise<T>((resolve, reject) => {
    handlers.resolve = resolve
    handlers.reject = reject
  })

  return {
    promise,
    resolve: handlers.resolve,
    reject: handlers.reject,
  }
}
