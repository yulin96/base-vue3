import { beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ api: undefined as object | undefined, init: vi.fn(), haptic: vi.fn() }))
vi.mock('@/config/env', () => ({
  get electronApi() {
    return mocks.api
  },
}))
vi.mock('@/utils/interactionStats', () => ({ initInteractionStats: mocks.init }))
vi.mock('@/plugins/setup/buttonHaptic', () => ({ setupButtonHaptic: mocks.haptic }))
vi.mock('@/plugins/setup/buttonEffect', () => ({}))
vi.mock('@/plugins/setup/clickThrottle', () => ({}))
vi.mock('@/plugins/setup/dev', () => ({}))
vi.mock('@/plugins/setup/gsap', () => ({}))
vi.mock('@/plugins/setup/resetWxFontSize', () => ({}))
vi.mock('@vant/touch-emulator', () => ({}))

beforeEach(() => {
  vi.resetModules()
  mocks.init.mockResolvedValue({ initialized: true, error: null })
})

test.each([
  { api: {}, id: '23456789', calls: 1 },
  { api: undefined, id: '23456789', calls: 0 },
  { api: {}, id: '', calls: 0 },
])('启动统计条件：%j', async ({ api, id, calls }) => {
  mocks.api = api
  vi.stubEnv('VITE_APP_STATS_PROJECT_ID', id)
  await import('@/plugins/appInit')
  expect(mocks.init).toHaveBeenCalledTimes(calls)
  expect(mocks.haptic).toHaveBeenCalledTimes(1)
})

test('初始化失败明确记录错误', async () => {
  mocks.api = {}
  vi.stubEnv('VITE_APP_STATS_PROJECT_ID', '23456789')
  mocks.init.mockResolvedValue({ initialized: false, error: '磁盘失败' })
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  await import('@/plugins/appInit')
  expect(log).toHaveBeenCalledWith('统计初始化失败：', '磁盘失败')
})
