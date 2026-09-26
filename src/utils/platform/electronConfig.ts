import { electronApi } from '@/config/env'

const listKeys = [
  'list1',
  'list2',
  'list3',
  'list4',
  'list5',
  'list6',
  'list7',
  'list8',
  'list9',
  'list10',
  'list11',
  'list12',
  'list13',
  'list14',
  'list15',
  'list16',
  'list17',
  'list18',
  'list19',
  'list20',
] as const

export type ElectronListKey = (typeof listKeys)[number]
export type ElectronListConfig = Pick<AppConfig, ElectronListKey>
export type ElectronConfigOptions = Partial<Record<ElectronListKey, { name?: string }>>

export async function setupElectronConfig(options: ElectronConfigOptions): Promise<ElectronListConfig> {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Electron 配置声明必须是对象')
  }

  const names: ConfigDisplayNames = {}
  for (const [key, option] of Object.entries(options)) {
    if (!listKeys.includes(key as ElectronListKey)) {
      throw new TypeError(`不支持的 Electron 配置项：${key}`)
    }
    if (!option || typeof option !== 'object' || Array.isArray(option)) {
      throw new TypeError(`${key} 必须是包含 name 的对象`)
    }
    for (const [field, value] of Object.entries(option)) {
      if (field !== 'name' || typeof value !== 'string') {
        throw new TypeError(`${key}.${field} 仅支持 name 字符串`)
      }
      names[key as ElectronListKey] = value
    }
  }

  let values: Partial<ElectronListConfig> = {}
  if (electronApi) {
    const hasNames = Object.keys(names).length > 0
    if (typeof electronApi.getConfig !== 'function') {
      throw new Error('客户端缺少 getConfig 接口')
    }
    if (hasNames && typeof electronApi.defineDisplayNames !== 'function') {
      throw new Error('客户端缺少 defineDisplayNames 接口')
    }

    const config = await electronApi.getConfig()
    if (!config || listKeys.some((key) => typeof config[key] !== 'string')) {
      throw new Error('客户端返回的 list 配置无效')
    }
    values = config
    if (hasNames) await electronApi.defineDisplayNames?.(names)
  }

  return Object.fromEntries(listKeys.map((key) => [key, values[key] ?? ''])) as ElectronListConfig
}
