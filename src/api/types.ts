export type ResData<T = unknown, TExtra extends object = Record<never, never>> = {
  code: number
  msg?: string
  message?: string
  data: T
} & TExtra
