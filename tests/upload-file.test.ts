import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  multipartUpload: vi.fn(),
  fetch: vi.fn(),
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

vi.mock('@/config/services', () => ({
  services: {
    upload: { stsUrl: 'https://upload.example/sts', endpoint: 'https://oss.example', publicUrl: 'https://cdn.example' },
  },
}))
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return {
    ...actual,
    default: { ...actual.default, post: mocks.post },
    toFormData: (data: object) => actual.toFormData(data, new FormData()),
  }
})
vi.mock('ali-oss', () => ({
  default: vi.fn(function () {
    return { multipartUpload: mocks.multipartUpload }
  }),
}))
vi.mock('nanoid', () => ({ nanoid: () => 'fixed' }))
vi.mock('vue-sonner', () => ({ toast: mocks.toast }))

const file = new File(['image'], 'photo.png', { type: 'image/png' })
const url = 'https://cdn.example/uploads/zh-fixed.png'

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.post.mockReset().mockResolvedValue({
    data: {
      data: {
        bucket: 'bucket-test',
        region: 'cn-beijing',
        uploadDir: 'uploads/',
        accessKeyId: 'test-id',
        accessKeySecret: 'test-secret',
        stsToken: 'test-token',
      },
    },
  })
  mocks.multipartUpload.mockReset().mockResolvedValue({})
  mocks.fetch.mockReset().mockResolvedValue({ status: 204 })
  Object.values(mocks.toast).forEach((mock) => mock.mockReset())
  mocks.toast.loading.mockReturnValue('upload-toast')
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

test.each([
  { loading: false, progress: [], success: [], dismiss: [], timerCount: 0 },
  {
    loading: true,
    progress: ['0%', '40%', '100%'],
    success: [['上传成功', { id: 'upload-toast' }]],
    dismiss: [['upload-toast']],
    timerCount: 1,
  },
])(
  '普通上传 loading=$loading 时，只等待上传完成并使用真实进度',
  async ({ loading, progress, success, dismiss, timerCount }) => {
    let completeUpload!: () => void
    mocks.multipartUpload.mockReturnValue(
      new Promise<void>((resolve) => {
        completeUpload = resolve
      }),
    )
    const { uploadFile } = await import('@/utils/file/uploadFile')
    const settled = vi.fn()
    const uploading = uploadFile({ id: 'project-1', file, loading }).then(settled)
    await flushPromises()
    expect(mocks.multipartUpload).toHaveBeenCalledTimes(1)
    expect(settled).not.toHaveBeenCalled()
    expect(mocks.toast.success).not.toHaveBeenCalled()
    const { progress: updateProgress } = mocks.multipartUpload.mock.calls[0]![2] as {
      progress: (value: number) => void
    }
    updateProgress(0.4)

    completeUpload()
    await flushPromises()
    expect(settled).toHaveBeenCalledExactlyOnceWith([null, url])
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.toast.error).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(timerCount)
    expect(mocks.toast.loading.mock.calls.map(([, options]) => options.style['--process-toast'])).toEqual(progress)
    expect(mocks.toast.success.mock.calls).toEqual(success)
    expect(mocks.toast.dismiss).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    expect(mocks.toast.dismiss.mock.calls).toEqual(dismiss)
    expect(vi.getTimerCount()).toBe(0)
    await uploading
  },
)

test('开启验证时立即执行一次 HEAD，并等待检查成功后再返回和提示', async () => {
  let completeVerification!: (response: { status: number }) => void
  mocks.fetch.mockReturnValue(
    new Promise<{ status: number }>((resolve) => {
      completeVerification = resolve
    }),
  )
  const { uploadFile } = await import('@/utils/file/uploadFile')
  const settled = vi.fn()
  const uploading = uploadFile({ id: 'project-1', file, loading: true, test: true }).then(settled)
  await flushPromises()
  expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(url, { method: 'HEAD' })
  expect(settled).not.toHaveBeenCalled()
  expect(mocks.toast.success).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)

  completeVerification({ status: 204 })
  await flushPromises()
  expect(settled).toHaveBeenCalledExactlyOnceWith([null, url])
  expect(mocks.toast.success).toHaveBeenCalledExactlyOnceWith('上传成功', { id: 'upload-toast' })
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
  await uploading
})

test.each(['HTTP 失败', '网络异常'])('资源验证%s时保留错误结果，不提示成功', async (failure) => {
  if (failure === 'HTTP 失败') mocks.fetch.mockResolvedValue({ status: 404 })
  else mocks.fetch.mockRejectedValue(new Error('HEAD failed'))
  const { uploadFile } = await import('@/utils/file/uploadFile')
  const settled = vi.fn()
  const uploading = uploadFile({ id: 'project-1', file, loading: true, test: true }).then(settled)
  await flushPromises()
  expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(url, { method: 'HEAD' })
  expect(settled).toHaveBeenCalledExactlyOnceWith([new Error('File upload verify failed'), null])
  expect(mocks.toast.success).not.toHaveBeenCalled()
  expect(mocks.toast.error).toHaveBeenCalledExactlyOnceWith('上传文件不符合规范，请更换文件重试', {
    id: 'upload-toast',
  })
  expect(vi.getTimerCount()).toBe(1)
  await vi.advanceTimersByTimeAsync(2600)
  expect(mocks.toast.dismiss).toHaveBeenCalledExactlyOnceWith('upload-toast')
  expect(vi.getTimerCount()).toBe(0)
  await uploading
})

test.each(['获取凭据', '上传'])('%s失败时保留原始错误，不执行资源验证', async (stage) => {
  const error = new Error(`${stage}失败`)
  if (stage === '获取凭据') mocks.post.mockRejectedValue(error)
  else mocks.multipartUpload.mockRejectedValue(error)
  const { uploadFile } = await import('@/utils/file/uploadFile')
  const result = await uploadFile({ id: 'project-1', file, loading: true, test: true })
  expect(result[0]).toBe(error)
  expect(result[1]).toBeNull()
  expect(mocks.multipartUpload).toHaveBeenCalledTimes(stage === '获取凭据' ? 0 : 1)
  expect(mocks.fetch).not.toHaveBeenCalled()
  expect(mocks.toast.success).not.toHaveBeenCalled()
  expect(mocks.toast.error).toHaveBeenCalledExactlyOnceWith('上传失败', { id: 'upload-toast' })
  expect(vi.getTimerCount()).toBe(1)
  await vi.advanceTimersByTimeAsync(2600)
  expect(mocks.toast.dismiss).toHaveBeenCalledExactlyOnceWith('upload-toast')
  expect(vi.getTimerCount()).toBe(0)
})
