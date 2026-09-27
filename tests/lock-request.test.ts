import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { CanceledError } from 'axios'
import { useLockRequest } from '@/hooks/network/useLockRequest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), warning: vi.fn() }))
vi.mock('@/utils/request', () => ({ axiosGet: mocks.get, axiosPost: mocks.post }))
vi.mock('vue-sonner', () => ({ toast: { warning: mocks.warning } }))
beforeEach(() => {
  vi.useFakeTimers()
  mocks.get.mockReset()
  mocks.post.mockReset()
})
afterEach(() => {
  vi.useRealTimers()
})

test('同一把锁阻止并发及冷却期重复请求，500ms 后恢复', async () => {
  const pending = Promise.withResolvers<{ code: number }>()
  mocks.post.mockReturnValueOnce(pending.promise).mockResolvedValue({ code: 200 })
  const request = useLockRequest()
  const first = request.post('/submit')
  expect(request.lock.value).toBe(true)
  await expect(request.post('/submit')).rejects.toMatchObject({ code: -9996 })
  expect(mocks.post).toHaveBeenCalledTimes(1)
  pending.resolve({ code: 200 })
  await expect(first).resolves.toEqual({ code: 200 })
  await vi.advanceTimersByTimeAsync(499)
  await expect(request.post('/submit')).rejects.toMatchObject({ code: -9996 })
  await vi.advanceTimersByTimeAsync(1)
  expect(request.lock.value).toBe(false)
  await request.post('/submit')
  expect(mocks.post).toHaveBeenCalledTimes(2)
})

test('不同接口的请求锁相互独立，参数和配置完整透传', async () => {
  const signal = new AbortController().signal
  const config = { signal, timeout: 1000 }
  const first = useLockRequest(false, 0)
  const second = useLockRequest(false, 0)
  await Promise.all([first.post('/submit', { id: 1 }, config, 'FormData'), second.get('/list', { page: 2 }, config)])
  expect(mocks.post).toHaveBeenCalledWith('/submit', { id: 1 }, config, 'FormData')
  expect(mocks.get).toHaveBeenCalledWith('/list', { page: 2 }, config, undefined)
  expect(first.lock.value).toBe(false)
  expect(second.lock.value).toBe(false)
})

test.each([
  { error: new Error('断网'), silent: false, toasts: 1 },
  { error: new CanceledError('取消'), silent: false, toasts: 0 },
  { error: new Error('后台请求失败'), silent: true, toasts: 0 },
])('失败后解锁并遵守取消/静默提示约定：$error.message', async ({ error, silent, toasts }) => {
  mocks.get.mockRejectedValueOnce(error).mockResolvedValueOnce({ code: 200 })
  const request = useLockRequest(false, 0, { silent })
  await expect(request.get('/list')).rejects.toBe(error)
  expect(request.lock.value).toBe(false)
  expect(mocks.warning).toHaveBeenCalledTimes(toasts)
  await expect(request.get('/list')).resolves.toEqual({ code: 200 })
})
