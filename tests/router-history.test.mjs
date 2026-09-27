import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import { createMemoryHistory, createRouter, isNavigationFailure, NavigationFailureType } from 'vue-router'

async function setup(stack = []) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/a', '/b', '/c'].map((path) => ({ path, name: path, component: {} })),
  })
  let stored = JSON.stringify(stack)
  const source = stripTypeScriptTypes(
    readFileSync(new URL('../src/router/history.ts', import.meta.url), 'utf8'),
  )
    .replace(/^import .*$/gm, '')
    .replace(/^export /gm, '')
  const context = {
    router,
    appStorageName: 'router-history-test',
    sessionStorage: {
      getItem: () => stored,
      setItem: (_key, value) => { stored = value },
    },
  }
  vm.createContext(context)
  vm.runInContext(`${source}\nglobalThis.api = { replaceTo, goBack }`, context)
  await router.push('/a')
  return { router, ...context.api, getStack: () => JSON.parse(stored) }
}

test('混用固定返回后可以返回指定页面并清空旧历史', async () => {
  const { router, replaceTo, goBack, getStack } = await setup()
  await replaceTo('/b')
  await router.replace('/a')
  await goBack('/c')
  assert.equal(router.currentRoute.value.fullPath, '/c')
  assert.deepEqual(getStack(), [])
})

test('指定目标优先于上一页，回退到历史中最近一次出现的位置', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b', '/c', '/b', '/c'])
  await goBack('/b')
  assert.equal(router.currentRoute.value.fullPath, '/b')
  assert.deepEqual(getStack(), ['/', '/b', '/c'])
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/c')
  assert.deepEqual(getStack(), ['/', '/b'])
})

test('支持路由名称对象，按完整 query 匹配历史', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b?step=1', '/b?step=2', '/c'])
  await goBack({ name: '/b', query: { step: '1' } })
  assert.equal(router.currentRoute.value.fullPath, '/b?step=1')
  assert.deepEqual(getStack(), ['/'])
})

test('指定目标不在历史中，成功后清空旧返回栈', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b'])
  await goBack('/c')
  assert.equal(router.currentRoute.value.fullPath, '/c')
  assert.deepEqual(getStack(), [])
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/')
})

test('指定当前页或被守卫取消时不改变历史', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b'])
  assert(isNavigationFailure(await goBack('/a'), NavigationFailureType.duplicated))
  assert.deepEqual(getStack(), ['/', '/b'])
  const removeGuard = router.beforeEach(() => false)
  assert(isNavigationFailure(await goBack('/b'), NavigationFailureType.aborted))
  assert.deepEqual(getStack(), ['/', '/b'])
  removeGuard()
})

test('指定目标导航异常时不改变历史', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b'])
  router.onError(() => {})
  router.beforeEach(() => { throw new Error('guard failed') })
  await assert.rejects(goBack('/b'), /guard failed/)
  assert.deepEqual(getStack(), ['/', '/b'])
})

test('连续相同栈顶全部跳过，返回更早的不同页面', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b', '/a', '/a'])
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/b')
  assert.deepEqual(getStack(), ['/'])
})

test('清除相同栈顶后没有历史，默认回首页', async () => {
  const { router, goBack, getStack } = await setup(['/a'])
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/')
  assert.deepEqual(getStack(), [])
})

test('有效目标被守卫拒绝时保留历史，解除拦截后可以再次返回', async () => {
  const { router, goBack, getStack } = await setup(['/b', '/a'])
  const removeGuard = router.beforeEach(() => false)
  assert(isNavigationFailure(await goBack(), NavigationFailureType.aborted))
  assert.deepEqual(getStack(), ['/b'])
  assert.equal(router.currentRoute.value.fullPath, '/a')
  removeGuard()
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/b')
  assert.deepEqual(getStack(), [])
})

test('返回发生异常时保留有效历史', async () => {
  const { router, goBack, getStack } = await setup(['/b', '/a'])
  router.onError(() => {})
  router.beforeEach(() => { throw new Error('guard failed') })
  await assert.rejects(goBack(), /guard failed/)
  assert.deepEqual(getStack(), ['/b'])
})

test('同一路径但 query 不同仍作为有效历史返回', async () => {
  const { router, goBack, getStack } = await setup(['/a?step=1'])
  await router.replace('/a?step=2')
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/a?step=1')
  assert.deepEqual(getStack(), [])
})

test('正常前进和返回保持不变，重复前进不入栈', async () => {
  const { router, replaceTo, goBack, getStack } = await setup()
  assert(isNavigationFailure(await replaceTo('/a'), NavigationFailureType.duplicated))
  assert.deepEqual(getStack(), [])
  await replaceTo('/b')
  await replaceTo('/c')
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/b')
  assert.deepEqual(getStack(), ['/a'])
  await goBack()
  assert.equal(router.currentRoute.value.fullPath, '/a')
  assert.deepEqual(getStack(), [])
})
