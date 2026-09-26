import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { stripTypeScriptTypes } from 'node:module'

function setup(electronApi, projectId = '23456789') {
  const text = readFileSync(new URL('../src/utils/interactionStats.ts', import.meta.url), 'utf8')
    .replaceAll('import.meta.env.VITE_APP_STATS_PROJECT_ID', JSON.stringify(projectId))
  const source = stripTypeScriptTypes(text)
    .replace("import { electronApi } from '@/config/env'", '')
    .replace('export async function recordInteractionStat', 'exports.recordInteractionStat = async function')
    .replace('export function initInteractionStats', 'function initInteractionStats')
  const exports = {}
  vm.runInNewContext(source, { exports, Error, electronApi })
  return exports.recordInteractionStat
}

test('自动初始化一次后转发 projectId 和事件，返回本地结果', async () => {
  const calls = []
  const record = setup({ initInteractionStats: async () => ({ initialized: true, error: null }), recordInteractionStat: async input => {
    calls.push(input)
    return { saved: true, error: null }
  } })
  assert.equal((await record(' 开始 ')).saved, true)
  assert.equal((await record('完成')).saved, true)
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { projectId: '23456789', event: '开始' },
    { projectId: '23456789', event: '完成' },
  ])
})

test('普通浏览器、旧客户端及无效参数明确失败，不尝试兜底', async () => {
  assert.match((await setup(undefined)('开始')).error, /不支持统计/)
  assert.match((await setup({})('开始')).error, /不支持统计/)
  let called = false
  const api = { recordInteractionStat: () => { called = true } }
  assert.equal((await setup(api, '')('开始')).saved, false)
  assert.equal((await setup(api)(' ')).saved, false)
  assert.equal((await setup(api)('字'.repeat(65))).saved, false)
  assert.equal(called, false)
})

test('IPC 失败和本地保存失败返回明确结果，不重试', async () => {
  let calls = 0
  const record = setup({ initInteractionStats: async () => ({ initialized: true, error: null }), recordInteractionStat: async () => {
    calls++
    throw new Error('IPC 失败')
  } })
  assert.equal((await record('开始')).error, 'IPC 失败')
  assert.equal(calls, 1)
  const failure = await setup({ initInteractionStats: async () => ({ initialized: true, error: null }), recordInteractionStat: async () => ({ saved: false, error: '磁盘失败' }) })('完成')
  assert.equal(failure.saved, false)
  assert.equal(failure.error, '磁盘失败')
})


test('并发事件等待同一次初始化，失败后不发送事件、不自动重试', async () => {
  let inits = 0
  let records = 0
  let finish
  const pending = new Promise(resolve => { finish = resolve })
  const record = setup({
    initInteractionStats: () => { inits++; return pending },
    recordInteractionStat: async () => { records++; return { saved: true, error: null } },
  })
  const first = record('开始')
  const second = record('完成')
  assert.equal(inits, 1)
  assert.equal(records, 0)
  finish({ initialized: true, error: null })
  await Promise.all([first, second])
  assert.equal(records, 2)
  let failedInits = 0
  const failure = setup({
    initInteractionStats: async () => { failedInits++; throw new Error('初始化失败') },
    recordInteractionStat: () => { throw new Error('不应调用') },
  })
  assert.equal((await failure('开始')).error, '初始化失败')
  assert.equal((await failure('完成')).saved, false)
  assert.equal(failedInits, 1)
})

test('启动入口在客户端已配置 ID 时自动初始化，无需发送事件；浏览器和空 ID 跳过', async () => {
  const text = readFileSync(new URL('../src/plugins/appInit.ts', import.meta.url), 'utf8')
  const source = stripTypeScriptTypes(text).replace(/^import .*$/gm, '').replaceAll('import.meta.env', 'env')
  for (const [api, projectId, expected] of [[{}, '23456789', 1], [undefined, '23456789', 0], [{}, '', 0]]) {
    let calls = 0
    const document = { documentElement: { style: { setProperty() {} } } }
    vm.runInNewContext(source, {
      electronApi: api,
      env: { VITE_APP_STATS_PROJECT_ID: projectId },
      window: { document }, document, setupButtonHaptic() {}, console,
      initInteractionStats: async () => { calls++; return { initialized: true, error: null } },
    })
    await Promise.resolve()
    assert.equal(calls, expected)
  }
})
