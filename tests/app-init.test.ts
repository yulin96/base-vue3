import { beforeEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ haptic: vi.fn() }))
vi.mock('@/plugins/setup/buttonHaptic', () => ({ setupButtonHaptic: mocks.haptic }))
vi.mock('@/plugins/setup/buttonEffect', () => ({}))
vi.mock('@/plugins/setup/clickThrottle', () => ({}))
vi.mock('@/plugins/setup/dev', () => ({}))
vi.mock('@/plugins/setup/gsap', () => ({}))
vi.mock('@/plugins/setup/resetWxFontSize', () => ({}))
vi.mock('@vant/touch-emulator', () => ({}))

beforeEach(() => vi.resetModules())

test('启动只安装交互能力，无需统计初始化', async () => {
  await import('@/plugins/appInit')
  expect(mocks.haptic).toHaveBeenCalledTimes(1)
})
