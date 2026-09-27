import { beforeEach, expect, test, vi } from 'vitest'
import { setupElectronConfig, type ElectronConfigOptions } from '@/utils/platform/electronConfig'

const state = vi.hoisted(() => ({ api: undefined as Partial<NonNullable<Window['api']>> | undefined }))
vi.mock('@/config/env', () => ({
  get electronApi() {
    return state.api
  },
}))
beforeEach(() => {
  state.api = undefined
})
const lists = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`list${i + 1}`, `现场${i + 1}`])) as Pick<
  AppConfig,
  ProjectFieldKey
>

test('只声明业务字段并返回客户端实际配置', async () => {
  const defineProjectFields = vi.fn().mockResolvedValue({ config: lists, errors: {} })
  const defineConfig = vi.fn()
  const api = { defineProjectFields, defineConfig, defineDisplayNames: vi.fn(), saveConfigFile: vi.fn() }
  state.api = api
  const fields: ElectronConfigOptions = {
    list1: { name: '等待时间', type: 'number', default: '10' },
    list2: { type: 'switch', default: '1' },
  }
  await expect(setupElectronConfig(fields)).resolves.toEqual(lists)
  expect(defineProjectFields).toHaveBeenCalledExactlyOnceWith(fields)
  expect(defineConfig).not.toHaveBeenCalled()
  expect(api.defineDisplayNames).not.toHaveBeenCalled()
  expect(api.saveConfigFile).not.toHaveBeenCalled()
})

test.each([
  { list21: {} },
  { list1: { name: 1 } },
  { list1: { type: 'date' } },
  { list1: { type: 'number', default: 'x' } },
  { list1: { type: 'switch', default: 'true' } },
  { list1: { type: 'select', options: ['A', 'A'] } },
  { list1: { type: 'select', options: ['A'], default: 'B' } },
  { list1: { type: 'text', options: [] } },
])('无效声明在 IPC 调用前拒绝：%j', async (input) => {
  const defineProjectFields = vi.fn()
  state.api = { defineProjectFields }
  await expect(setupElectronConfig(input as unknown as ElectronConfigOptions)).rejects.toThrow(TypeError)
  expect(defineProjectFields).not.toHaveBeenCalled()
})

test('浏览器使用声明默认值，其余字段为空且不持久化', async () => {
  const storage = vi.spyOn(Storage.prototype, 'setItem')
  const result = await setupElectronConfig({
    list1: { name: '时间', type: 'number', default: '10' },
    list2: { type: 'switch', default: '0' },
    list3: { type: 'select', options: ['自动', '手动'], default: '自动' },
    list4: { name: '备注' },
  })
  expect(Object.keys(result)).toHaveLength(20)
  expect(result).toMatchObject({ list1: '10', list2: '0', list3: '自动', list4: '' })
  expect(storage).not.toHaveBeenCalled()
})

test('旧客户端、无效返回和不兼容用户值明确报错', async () => {
  state.api = {}
  await expect(setupElectronConfig({})).rejects.toThrow(/defineProjectFields/)
  state.api = { defineProjectFields: vi.fn().mockResolvedValue({ config: {}, errors: {} }) }
  await expect(setupElectronConfig({})).rejects.toThrow(/无效/)
  state.api.defineProjectFields = vi.fn().mockRejectedValue(new Error('冲突'))
  await expect(setupElectronConfig({})).rejects.toThrow('冲突')
  state.api.defineProjectFields = vi.fn().mockResolvedValue({ config: lists, errors: { list1: '请选择开启或关闭' } })
  await expect(setupElectronConfig({})).rejects.toThrow(/F12.*list1/)
})
