import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), replace: vi.fn(), info: vi.fn(), warning: vi.fn() }))
vi.mock('@/utils/request', () => ({ axiosGet: mocks.get, axiosPost: vi.fn() }))
vi.mock('@/router', () => ({ replaceTo: mocks.replace }))
vi.mock('vue-sonner', () => ({ toast: { info: mocks.info, warning: mocks.warning } }))
vi.mock('@/config/services', () => ({ services: { menus: { url: 'https://menus.example/default' } } }))

const menu = { title: '入口', status: 1, url: '/next', remark: '' }
let location: { href: string }

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  mocks.get.mockReset()
  mocks.replace.mockReset()
  mocks.info.mockReset()
  mocks.warning.mockReset()
  location = { href: 'https://current.example/' }
  vi.stubGlobal('window', { location })
})
afterEach(() => vi.useRealTimers())

test('菜单请求保留成功结果及可覆盖的接口地址', async () => {
  const { apiMenus } = await import('@/api')
  mocks.get.mockResolvedValue({ code: 200, data: menu })
  await expect(apiMenus('入口', 'https://menus.example/custom')).resolves.toEqual([true, menu])
  expect(mocks.get).toHaveBeenCalledExactlyOnceWith(
    'https://menus.example/custom',
    { title: '入口' },
    undefined,
    undefined,
  )
  expect(mocks.info).not.toHaveBeenCalled()
  expect(mocks.replace).not.toHaveBeenCalled()
})

test('菜单请求默认地址读取集中配置', async () => {
  const { apiMenus } = await import('@/api')
  mocks.get.mockResolvedValue({ code: 200, data: menu })
  await expect(apiMenus('入口')).resolves.toEqual([true, menu])
  expect(mocks.get).toHaveBeenCalledExactlyOnceWith(
    'https://menus.example/default',
    { title: '入口' },
    undefined,
    undefined,
  )
})

test('菜单请求失败保留 false/null 结果', async () => {
  const { apiMenus } = await import('@/api')
  mocks.get.mockRejectedValue(new Error('offline'))
  await expect(apiMenus('入口')).resolves.toEqual([false, null])
  expect(mocks.info).not.toHaveBeenCalled()
  expect(mocks.replace).not.toHaveBeenCalled()
})

test('菜单不可用时提示，不执行覆盖回调或跳转', async () => {
  const { replaceToWithMenus } = await import('@/utils/navigation')
  mocks.get.mockResolvedValue({ code: 200, data: { ...menu, status: 0 } })
  const callback = vi.fn()
  await replaceToWithMenus('入口', callback)
  expect(mocks.info).toHaveBeenCalledExactlyOnceWith('敬请期待')
  expect(callback).not.toHaveBeenCalled()
  expect(mocks.replace).not.toHaveBeenCalled()
  expect(location.href).toBe('https://current.example/')
})

test('请求失败时保持提示行为', async () => {
  const { replaceToWithMenus } = await import('@/utils/navigation')
  mocks.get.mockRejectedValue(new Error('offline'))
  await replaceToWithMenus('入口')
  expect(mocks.info).toHaveBeenCalledExactlyOnceWith('敬请期待')
  expect(mocks.replace).not.toHaveBeenCalled()
  expect(location.href).toBe('https://current.example/')
})

test('没有目标地址时保留空地址提示', async () => {
  const { replaceToWithMenus } = await import('@/utils/navigation')
  mocks.get.mockResolvedValue({ code: 200, data: { ...menu, url: '' } })
  await replaceToWithMenus('入口')
  expect(mocks.info).toHaveBeenCalledExactlyOnceWith('敬请期待!')
  expect(mocks.replace).not.toHaveBeenCalled()
})

test('覆盖回调优先于服务端地址，且仅执行一次', async () => {
  const { replaceToWithMenus } = await import('@/utils/navigation')
  mocks.get.mockResolvedValue({ code: 200, data: menu })
  const callback = vi.fn()
  await replaceToWithMenus('入口', callback)
  expect(callback).toHaveBeenCalledTimes(1)
  expect(mocks.replace).not.toHaveBeenCalled()
  expect(mocks.info).not.toHaveBeenCalled()
  expect(location.href).toBe('https://current.example/')
})

test('覆盖路由优先于服务端地址', async () => {
  const { replaceToWithMenus } = await import('@/utils/navigation')
  mocks.get.mockResolvedValue({ code: 200, data: menu })
  await replaceToWithMenus('入口', '/override')
  expect(mocks.replace).toHaveBeenCalledExactlyOnceWith('/override')
  expect(mocks.info).not.toHaveBeenCalled()
})

test('外链使用浏览器跳转，不调用路由', async () => {
  const { replaceToWithMenus } = await import('@/utils/navigation')
  mocks.get.mockResolvedValue({ code: 200, data: { ...menu, url: 'https://target.example/page?id=1' } })
  await replaceToWithMenus('入口')
  expect(location.href).toBe('https://target.example/page?id=1')
  expect(mocks.replace).not.toHaveBeenCalled()
  expect(mocks.info).not.toHaveBeenCalled()
})

test('内部地址继续使用项目路由跳转', async () => {
  const { replaceToWithMenus } = await import('@/utils/navigation')
  mocks.get.mockResolvedValue({ code: 200, data: menu })
  await replaceToWithMenus('入口')
  expect(mocks.replace).toHaveBeenCalledExactlyOnceWith('/next')
  expect(mocks.info).not.toHaveBeenCalled()
  expect(location.href).toBe('https://current.example/')
})
