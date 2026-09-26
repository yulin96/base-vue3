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
export type ElectronConfigOptions = ProjectFieldDefinitions

export async function setupElectronConfig(options: ElectronConfigOptions): Promise<ElectronListConfig> {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Electron 字段声明必须是对象')
  }
  for (const [key, field] of Object.entries(options)) {
    if (!listKeys.includes(key as ElectronListKey)) throw new TypeError(`不支持的 Electron 配置项：${key}`)
    if (!field || typeof field !== 'object' || Array.isArray(field)) throw new TypeError(`${key} 字段声明无效`)
    if (Object.keys(field).some(key => !['name', 'type', 'default', 'options'].includes(key))) throw new TypeError(`${key} 字段声明无效`)
    const type = field.type ?? 'text'
    if (!['text', 'number', 'switch', 'select'].includes(type)) throw new TypeError(`${key} 类型无效`)
    if (field.name !== undefined && (typeof field.name !== 'string' || !field.name.trim())) throw new TypeError(`${key} 名称无效`)
    if (type === 'select') {
      if (!Array.isArray(field.options) || !field.options.length || field.options.some(value => typeof value !== 'string' || !value.trim()) || new Set(field.options).size !== field.options.length) throw new TypeError(`${key} 选项无效`)
    } else if (field.options !== undefined) throw new TypeError(`${key} 仅下拉类型支持 options`)
    if (field.default !== undefined) {
      const value = field.default
      if (typeof value !== 'string' || (type === 'number' && (!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) || !Number.isFinite(Number(value)))) ||
        (type === 'switch' && !['0', '1'].includes(value)) || (type === 'select' && !field.options?.includes(value))) throw new TypeError(`${key} 默认值无效`)
    }
  }

  let values: Partial<ElectronListConfig>
  if (electronApi) {
    if (!electronApi.defineProjectFields) throw new Error('客户端缺少 defineProjectFields 接口，请升级客户端')
    const result = await electronApi.defineProjectFields(options)
    if (!result?.config || !result.errors || listKeys.some(key => typeof result.config[key] !== 'string')) throw new Error('客户端返回的业务字段配置无效')
    if (Object.keys(result.errors).length) {
      throw new Error('字段声明已保存，请在 F12 修正现有值：' + Object.entries(result.errors).map(([key, error]) => `${key} ${error}`).join('；'))
    }
    values = result.config
  } else {
    values = Object.fromEntries(Object.entries(options).map(([key, field]) => [key, field.default ?? '']))
  }
  return Object.fromEntries(listKeys.map(key => [key, values[key] ?? ''])) as ElectronListConfig
}
