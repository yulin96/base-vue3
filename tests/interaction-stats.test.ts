import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({ api: undefined as Partial<NonNullable<Window['api']>> | undefined }))
vi.mock('@/config/env', () => ({
  get electronApi() {
    return state.api
  },
}))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_APP_STATS_PROJECT_ID', '23456789')
  state.api = undefined
})

function client() {
  const api = {
    initInteractionStats: vi.fn().mockResolvedValue({ initialized: true, error: null }),
    recordInteractionStat: vi.fn().mockResolvedValue({ saved: true, error: null }),
  }
  state.api = api
  return api
}

test('自动初始化一次并转发 projectId 和去除首尾空格的事件', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  await expect(recordInteractionStat(' 开始 ')).resolves.toEqual({ saved: true, error: null })
  await recordInteractionStat('完成')
  expect(api.initInteractionStats).toHaveBeenCalledExactlyOnceWith({ projectId: '23456789' })
  expect(api.recordInteractionStat.mock.calls).toEqual([
    [{ projectId: '23456789', event: '开始' }],
    [{ projectId: '23456789', event: '完成' }],
  ])
})

test.each([undefined, {}])('普通浏览器或旧客户端明确失败：%j', async (api) => {
  state.api = api
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  expect(await recordInteractionStat('开始')).toEqual({ saved: false, error: expect.stringMatching(/不支持统计/) })
})

test('无效项目 ID 或事件不调用客户端', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  vi.stubEnv('VITE_APP_STATS_PROJECT_ID', '')
  expect((await recordInteractionStat('开始')).saved).toBe(false)
  vi.stubEnv('VITE_APP_STATS_PROJECT_ID', '23456789')
  expect((await recordInteractionStat(' ')).saved).toBe(false)
  expect((await recordInteractionStat('字'.repeat(65))).saved).toBe(false)
  expect(api.initInteractionStats).not.toHaveBeenCalled()
  expect(api.recordInteractionStat).not.toHaveBeenCalled()
})

test('按 Unicode 字符计数，64 个表情合法，65 个拒绝', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  expect((await recordInteractionStat('😀'.repeat(64))).saved).toBe(true)
  expect((await recordInteractionStat('😀'.repeat(65))).saved).toBe(false)
  expect(api.recordInteractionStat).toHaveBeenCalledTimes(1)
})

test('IPC 失败和本地保存失败返回明确结果，不重试', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  api.recordInteractionStat.mockRejectedValueOnce(new Error('IPC 失败'))
  await expect(recordInteractionStat('开始')).resolves.toEqual({ saved: false, error: 'IPC 失败' })
  expect(api.recordInteractionStat).toHaveBeenCalledTimes(1)
  api.recordInteractionStat.mockResolvedValueOnce({ saved: false, error: '磁盘失败' })
  await expect(recordInteractionStat('完成')).resolves.toEqual({ saved: false, error: '磁盘失败' })
})

test('并发事件等待同一次初始化', async () => {
  const api = client()
  const pending = Promise.withResolvers<InteractionStatInitResult>()
  api.initInteractionStats.mockReturnValue(pending.promise)
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  const first = recordInteractionStat('开始')
  const second = recordInteractionStat('完成')
  expect(api.initInteractionStats).toHaveBeenCalledTimes(1)
  expect(api.recordInteractionStat).not.toHaveBeenCalled()
  pending.resolve({ initialized: true, error: null })
  await Promise.all([first, second])
  expect(api.recordInteractionStat).toHaveBeenCalledTimes(2)
})

test('初始化失败不发送事件，也不自动重试', async () => {
  const api = client()
  api.initInteractionStats.mockRejectedValue(new Error('初始化失败'))
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  await expect(recordInteractionStat('开始')).resolves.toEqual({ saved: false, error: '初始化失败' })
  expect((await recordInteractionStat('完成')).saved).toBe(false)
  expect(api.initInteractionStats).toHaveBeenCalledTimes(1)
  expect(api.recordInteractionStat).not.toHaveBeenCalled()
})
