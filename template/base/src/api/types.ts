export type ResData<T extends object = {}> = {
  code: number
  msg?: string
  message?: string
  data: T
} & Record<PropertyKey, any>
