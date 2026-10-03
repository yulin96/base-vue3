import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { useLockRequest } from '@/hooks/network/useLockRequest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), warning: vi.fn() }))
vi.mock('@/utils/request', () => ({ axiosGet: mocks.get, axiosPost: mocks.post }))
vi.mock('vue-sonner', () => ({ toast: { warning: mocks.warning } }))
beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  mocks.get.mockReset()
  mocks.post.mockReset()
  mocks.warning.mockReset()
})

test.each([
  { error: new AxiosError('网络错误', 'ERR_NETWORK'), online: false, silent: false, toasts: 1 },
  { error: new AxiosError('网络错误', 'ERR_NETWORK'), online: true, silent: false, toasts: 0 },
  { error: new AxiosError('网络错误', 'ERR_NETWORK'), online: false, silent: true, toasts: 0 },
  { error: new CanceledError('取消'), online: false, silent: false, toasts: 0 },
  { error: new AxiosError('超时', 'ECONNABORTED'), online: false, silent: false, toasts: 0 },
  { error: new Error('普通异常'), online: false, silent: false, toasts: 0 },
])('网络提示：$error.message，online=$online，silent=$silent', async ({ error, online, silent, toasts }) => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
  mocks.post.mockRejectedValueOnce(error)
  const request = useLockRequest(false, 0, { silent })
  await expect(request.post('/submit')).rejects.toBe(error)
  expect(request.lock.value).toBe(false)
  expect(mocks.warning.mock.calls).toEqual(Array.from({ length: toasts }, () => ['网络已断开，请检查网络']))
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

function httpError(status: number) {
  return new AxiosError(`HTTP ${status}`, undefined, undefined, undefined, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

test.each([
  { error: httpError(500), silent: false, toasts: 1 },
  { error: httpError(500), silent: true, toasts: 0 },
  ...[400, 401, 404, 502, 503].map((status) => ({ error: httpError(status), silent: false, toasts: 0 })),
  { error: new AxiosError('断网', 'ERR_NETWORK'), silent: false, toasts: 0 },
  { error: new AxiosError('超时', 'ECONNABORTED'), silent: false, toasts: 0 },
  { error: new Error('普通异常'), silent: false, toasts: 0 },
  { error: new CanceledError('取消'), silent: false, toasts: 0 },
])('失败后解锁且仅非静默 HTTP 500 提示：$error.message，silent=$silent', async ({ error, silent, toasts }) => {
  mocks.get.mockRejectedValueOnce(error).mockResolvedValueOnce({ code: 500 })
  const request = useLockRequest(false, 0, { silent })
  await expect(request.get('/list')).rejects.toBe(error)
  expect(request.lock.value).toBe(false)
  expect(mocks.warning).toHaveBeenCalledTimes(toasts)
  expect(mocks.warning.mock.calls).toEqual(Array.from({ length: toasts }, () => ['正在处理中...']))
  await expect(request.get('/list')).resolves.toEqual({ code: 500 })
  expect(mocks.warning).toHaveBeenCalledTimes(toasts)
})
