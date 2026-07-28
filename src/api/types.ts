export type ResData<T extends object = {}> = {
  code: number
  msg?: string
  message?: string
  data: any
} & Record<PropertyKey, any>
