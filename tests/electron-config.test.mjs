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

test('声明名称并读取二十项实际值，不调用配置写入，空值保持不变', async () => {
  const calls = []
  const config = { ...lists, list1: '', list2: '0' }
  const run = setup({
    getConfig: async () => { calls.push('read'); return config },
    defineDisplayNames: async names => { calls.push(names) },
    defineConfig: () => { throw new Error('不得写入默认值') },
    saveConfigFile: () => { throw new Error('不得保存配置') },
  })
  const result = await run({ list1: { name: '活动编号' }, list20: { name: '业务参数' } })
  assert.deepEqual(JSON.parse(JSON.stringify(result)), config)
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), ['read', { list1: '活动编号', list20: '业务参数' }])
})

test('旧 default 参数和无效字段明确失败，不调用客户端', async () => {
  let calls = 0
  const run = setup({ getConfig: async () => { calls++; return lists } })
  await assert.rejects(run({ list1: { default: '旧默认值' } }), /name/)
  await assert.rejects(run({ list21: { name: '不支持' } }), /不支持/)
  await assert.rejects(run({ list1: { name: 1 } }), /name/)
  assert.equal(calls, 0)
})

test('普通浏览器返回空字符串；只读调用不要求名称接口', async () => {
  const browser = await setup(undefined)({ list1: { name: '活动编号' } })
  assert.equal(Object.keys(browser).length, 20)
  assert.equal(Object.values(browser).every(value => value === ''), true)
  assert.equal((await setup({ getConfig: async () => lists })({})).list20, '现场20')
})

test('客户端接口缺失、数据不完整、读取或命名失败均明确抛错', async () => {
  await assert.rejects(setup({})({}), /getConfig/)
  await assert.rejects(setup({ getConfig: async () => lists })({ list1: { name: '名称' } }), /defineDisplayNames/)
  await assert.rejects(setup({ getConfig: async () => ({}) })({}), /无效/)
  await assert.rejects(setup({ getConfig: async () => { throw new Error('读取失败') } })({}), /读取失败/)
  await assert.rejects(setup({
    getConfig: async () => lists,
    defineDisplayNames: async () => { throw new Error('命名失败') },
  })({ list1: { name: '名称' } }), /命名失败/)
})
