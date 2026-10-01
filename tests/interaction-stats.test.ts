import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({ api: undefined as Partial<NonNullable<Window['api']>> | undefined }))
vi.mock('@/config/env', () => ({
  get electronApi() {
    return state.api
  },
}))

beforeEach(() => {
  vi.resetModules()
  state.api = undefined
})

function client() {
  const api = {
    recordInteractionStat: vi.fn().mockResolvedValue({ saved: true, error: null }),
  }
  state.api = api
  return api
}

test('可选分组规范化后透传，非法分组不发送', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  await recordInteractionStat(' 进入 ', ' 屏幕1 ')
  expect(api.recordInteractionStat).toHaveBeenCalledExactlyOnceWith({ title: '屏幕1', event: '进入' })
  for (const title of ['', ' ', '😀'.repeat(65)]) expect((await recordInteractionStat('进入', title)).saved).toBe(false)
  expect(api.recordInteractionStat).toHaveBeenCalledTimes(1)
})

test('无需初始化或项目 ID，直接转发事件', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  await expect(recordInteractionStat(' 开始 ')).resolves.toEqual({ saved: true, error: null })
  await recordInteractionStat('完成')
  expect(api.recordInteractionStat.mock.calls).toEqual([[{ event: '开始' }], [{ event: '完成' }]])
})

test.each([undefined, {}])('普通浏览器或旧客户端明确失败：%j', async (api) => {
  state.api = api
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  expect(await recordInteractionStat('开始')).toEqual({ saved: false, error: expect.stringMatching(/不支持统计/) })
})

test('非法事件不调用客户端', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  expect((await recordInteractionStat(' ')).saved).toBe(false)
  expect((await recordInteractionStat('字'.repeat(65))).saved).toBe(false)
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

test('并发事件直接发送，无需初始化', async () => {
  const api = client()
  const { recordInteractionStat } = await import('@/utils/interactionStats')
  const results = await Promise.all([recordInteractionStat('开始'), recordInteractionStat('完成')])
  expect(results.every(({ saved }) => saved)).toBe(true)
  expect(api.recordInteractionStat).toHaveBeenCalledTimes(2)
})
