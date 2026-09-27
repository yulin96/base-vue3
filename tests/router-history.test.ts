import { beforeEach, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter, isNavigationFailure, NavigationFailureType, type Router } from 'vue-router'

const state = vi.hoisted(() => ({ router: undefined as Router | undefined }))
vi.mock('@/router', () => ({
  get default() {
    return state.router
  },
}))
vi.mock('@/config/env', () => ({ appStorageName: 'router-history-test' }))
import { goBack, replaceTo } from '@/router/history'

beforeEach(() => sessionStorage.clear())

async function setup(stack: string[] = []) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/a', '/b', '/c'].map((path) => ({ path, name: path, component: {} })),
  })
  state.router = router
  const key = 'ROUTER-HISTORY-TESTROUTER_HISTORY_STACK'
  sessionStorage.setItem(key, JSON.stringify(stack))
  await router.push('/a')
  return { router, goBack, replaceTo, getStack: () => JSON.parse(sessionStorage.getItem(key) || '[]') }
}

test('混用固定返回后可以返回指定页面并清空旧历史', async () => {
  const { router, replaceTo, goBack, getStack } = await setup()
  await replaceTo('/b')
  await router.replace('/a')
  await goBack('/c')
  expect(router.currentRoute.value.fullPath).toBe('/c')
  expect(getStack()).toEqual([])
})

test('指定目标优先于上一页，回退到历史中最近一次出现的位置', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b', '/c', '/b', '/c'])
  await goBack('/b')
  expect(router.currentRoute.value.fullPath).toBe('/b')
  expect(getStack()).toEqual(['/', '/b', '/c'])
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/c')
  expect(getStack()).toEqual(['/', '/b'])
})

test('支持路由名称对象，按完整 query 匹配历史', async () => {
  const { router, goBack, getStack } = await setup(['/c', '/?step=1', '/?step=2', '/b'])
  await goBack({ name: '/', query: { step: '1' } })
  expect(router.currentRoute.value.fullPath).toBe('/?step=1')
  expect(getStack()).toEqual(['/c'])
})

test('指定目标不在历史中，成功后清空旧返回栈', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b'])
  await goBack('/c')
  expect(router.currentRoute.value.fullPath).toBe('/c')
  expect(getStack()).toEqual([])
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/')
})

test('指定当前页或被守卫取消时不改变历史', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b'])
  expect(isNavigationFailure(await goBack('/a'), NavigationFailureType.duplicated)).toBe(true)
  expect(getStack()).toEqual(['/', '/b'])
  const removeGuard = router.beforeEach(() => false)
  expect(isNavigationFailure(await goBack('/b'), NavigationFailureType.aborted)).toBe(true)
  expect(getStack()).toEqual(['/', '/b'])
  removeGuard()
})

test('指定目标导航异常时不改变历史', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b'])
  router.onError(() => {})
  router.beforeEach(() => {
    throw new Error('guard failed')
  })
  await expect(goBack('/b')).rejects.toThrow(/guard failed/)
  expect(getStack()).toEqual(['/', '/b'])
})

test('连续相同栈顶全部跳过，返回更早的不同页面', async () => {
  const { router, goBack, getStack } = await setup(['/', '/b', '/a', '/a'])
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/b')
  expect(getStack()).toEqual(['/'])
})

test('清除相同栈顶后没有历史，默认回首页', async () => {
  const { router, goBack, getStack } = await setup(['/a'])
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/')
  expect(getStack()).toEqual([])
})

test('有效目标被守卫拒绝时保留历史，解除拦截后可以再次返回', async () => {
  const { router, goBack, getStack } = await setup(['/b', '/a'])
  const removeGuard = router.beforeEach(() => false)
  expect(isNavigationFailure(await goBack(), NavigationFailureType.aborted)).toBe(true)
  expect(getStack()).toEqual(['/b'])
  expect(router.currentRoute.value.fullPath).toBe('/a')
  removeGuard()
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/b')
  expect(getStack()).toEqual([])
})

test('返回发生异常时保留有效历史', async () => {
  const { router, goBack, getStack } = await setup(['/b', '/a'])
  router.onError(() => {})
  router.beforeEach(() => {
    throw new Error('guard failed')
  })
  await expect(goBack()).rejects.toThrow(/guard failed/)
  expect(getStack()).toEqual(['/b'])
})

test('同一路径但 query 不同仍作为有效历史返回', async () => {
  const { router, goBack, getStack } = await setup(['/a?step=1'])
  await router.replace('/a?step=2')
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/a?step=1')
  expect(getStack()).toEqual([])
})

test('正常前进和返回保持不变，重复前进不入栈', async () => {
  const { router, replaceTo, goBack, getStack } = await setup()
  expect(isNavigationFailure(await replaceTo('/a'), NavigationFailureType.duplicated)).toBe(true)
  expect(getStack()).toEqual([])
  await replaceTo('/b')
  await replaceTo('/c')
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/b')
  expect(getStack()).toEqual(['/a'])
  await goBack()
  expect(router.currentRoute.value.fullPath).toBe('/a')
  expect(getStack()).toEqual([])
})
