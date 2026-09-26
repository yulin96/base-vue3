import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

function setup(electronApi) {
  const source = stripTypeScriptTypes(readFileSync(new URL('../src/utils/platform/electronConfig.ts', import.meta.url), 'utf8'))
    .replace("import { electronApi } from '@/config/env'", '')
    .replace('export async function setupElectronConfig', 'exports.setupElectronConfig = async function')
  const exports = {}
  vm.runInNewContext(source, { exports, electronApi, Error, TypeError })
  return exports.setupElectronConfig
}
const lists = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`list${i + 1}`, `现场${i + 1}`]))

test('统一调用字段声明接口并返回实际配置，不调用旧名称或完整配置写入接口', async () => {
  const calls = []
  const run = setup({
    defineProjectFields: async fields => { calls.push(fields); return { config: lists, errors: {} } },
    defineDisplayNames: () => { throw new Error('不得用旧接口命名 list') },
    defineConfig: () => { throw new Error('不得写入设备配置') },
    saveConfigFile: () => { throw new Error('不得保存原始文件') },
  })
  const fields = { list1: { name: '等待时间', type: 'number', default: '10' }, list2: { type: 'switch', default: '1' } }
  assert.deepEqual(JSON.parse(JSON.stringify(await run(fields))), lists)
  assert.deepEqual(calls, [fields])
})

test('无效声明在调用前拒绝，包括非 list、类型、默认值、选项', async () => {
  let calls = 0
  const run = setup({ defineProjectFields: async () => { calls++; return { config: lists, errors: {} } } })
  for (const input of [
    { list21: {} }, { list1: { name: 1 } }, { list1: { type: 'date' } },
    { list1: { type: 'number', default: 'x' } }, { list1: { type: 'switch', default: 'true' } },
    { list1: { type: 'select', options: ['A', 'A'] } }, { list1: { type: 'select', options: ['A'], default: 'B' } },
    { list1: { type: 'text', options: [] } },
  ]) await assert.rejects(run(input))
  assert.equal(calls, 0)
})

test('普通浏览器使用声明默认值预览，其余字段为空，不持久化', async () => {
  const result = await setup(undefined)({
    list1: { name: '时间', type: 'number', default: '10' },
    list2: { type: 'switch', default: '0' },
    list3: { type: 'select', options: ['自动', '手动'], default: '自动' },
    list4: { name: '备注' },
  })
  assert.equal(Object.keys(result).length, 20)
  assert.equal(result.list1, '10')
  assert.equal(result.list2, '0')
  assert.equal(result.list3, '自动')
  assert.equal(result.list4, '')
})

test('旧客户端、读取错误和不兼容用户值明确报错，不退回默认值', async () => {
  await assert.rejects(setup({})({}), /defineProjectFields/)
  await assert.rejects(setup({ defineProjectFields: async () => ({ config: {}, errors: {} }) })({}), /无效/)
  await assert.rejects(setup({ defineProjectFields: async () => { throw new Error('冲突') } })({}), /冲突/)
  await assert.rejects(setup({ defineProjectFields: async () => ({ config: lists, errors: { list1: '请选择开启或关闭' } }) })({}), /F12.*list1/)
})
