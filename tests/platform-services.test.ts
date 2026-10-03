import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import OSS from 'ali-oss'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  requestPost: vi.fn(),
  multipartUpload: vi.fn(),
  wx: { config: vi.fn(), ready: vi.fn(), error: vi.fn() },
  user: { wxInfo: {} as { openid?: string; nickname?: string; avatar?: string } },
}))
vi.mock('@/config/services', () => ({
  services: {
    wechat: { sdkUrl: 'https://wechat.example/sign', codeUrl: 'https://wechat.example/code', name: 'project-platform' },
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
vi.mock('weixin-js-sdk', () => ({ default: mocks.wx }))
vi.mock('@/utils/request', () => ({ axiosPost: mocks.requestPost, axiosGet: vi.fn() }))
vi.mock('@/stores/user', () => ({ useStore: () => ({ user: mocks.user }) }))
vi.mock('@vueuse/core', () => ({ useUrlSearchParams: () => ({ proid: 'project-1' }) }))
vi.mock('nanoid', () => ({ nanoid: () => 'fixed' }))

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  mocks.post.mockReset()
  mocks.requestPost.mockReset()
  mocks.multipartUpload.mockReset().mockResolvedValue({})
  mocks.wx.config.mockClear()
  mocks.wx.ready.mockReset().mockImplementation((callback: () => void) => callback())
  mocks.wx.error.mockClear()
  mocks.user.wxInfo = {}
  vi.mocked(OSS).mockClear()
  history.replaceState({}, '', '/activity?step=1#part')
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

const sdkData = { appId: 'app-test', timestamp: '123', nonceStr: 'nonce-test', signature: 'signature-test' }

test('微信签名读取配置地址及平台名，并共享并发初始化', async () => {
  mocks.post.mockResolvedValue({ data: { data: sdkData } })
  const { ensureWechatSdkReady } = await import('@/utils/platform/wechat')
  await Promise.all([ensureWechatSdkReady(), ensureWechatSdkReady()])
  expect(mocks.post).toHaveBeenCalledTimes(1)
  const [url, data] = mocks.post.mock.calls[0]!
  expect(url).toBe('https://wechat.example/sign')
  expect([...data.entries()]).toEqual([
    ['url', `${location.origin}/activity?step=1`],
    ['name', 'project-platform'],
  ])
  expect(mocks.wx.config).toHaveBeenCalledTimes(1)
  expect(mocks.wx.config.mock.calls[0]![0]).toMatchObject({
    appId: 'app-test',
    timestamp: 123,
    nonceStr: 'nonce-test',
    signature: 'signature-test',
  })
})

test('微信签名响应无效时明确失败，之后可重新初始化', async () => {
  mocks.post.mockResolvedValueOnce({ data: { data: {} } }).mockResolvedValueOnce({ data: { data: sdkData } })
  const { ensureWechatSdkReady } = await import('@/utils/platform/wechat')
  await expect(ensureWechatSdkReady()).rejects.toThrow('微信 JSSDK 配置响应格式错误')
  expect(mocks.wx.config).not.toHaveBeenCalled()
  await ensureWechatSdkReady()
  expect(mocks.post).toHaveBeenCalledTimes(2)
  expect(mocks.wx.config).toHaveBeenCalledTimes(1)
})

test('openid 交换使用配置地址，保持用户状态更新', async () => {
  mocks.requestPost.mockResolvedValue({
    code: 200,
    data: { openid: 'openid-test', nickname: '测试用户', avatar: '/avatar.png' },
  })
  const { getOpenId } = await import('@/utils/platform/getOpenId')
  await expect(getOpenId()).resolves.toBe(true)
  expect(mocks.requestPost).toHaveBeenCalledExactlyOnceWith(
    'https://wechat.example/code',
    { proid: 'project-1' },
    undefined,
    undefined,
  )
  expect(mocks.user.wxInfo).toEqual({ openid: 'openid-test', nickname: '测试用户', avatar: '/avatar.png' })
})

test('上传和凭据刷新使用 STS 配置，资源地址独立于 OSS 接入域名', async () => {
  mocks.post
    .mockResolvedValueOnce({
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
    .mockResolvedValueOnce({
      data: {
        data: {
          accessKeyId: 'refreshed-id',
          accessKeySecret: 'refreshed-secret',
          stsToken: 'refreshed-token',
        },
      },
    })
  const { uploadFile } = await import('@/utils/file/uploadFile')
  const file = new File(['image'], 'photo.png', { type: 'image/png' })
  const uploading = uploadFile({ id: 'project-1', file })
  await flushPromises()
  await vi.advanceTimersByTimeAsync(2000)
  await expect(uploading).resolves.toEqual([null, 'https://cdn.example/uploads/zh-fixed.png'])
  expect(mocks.post.mock.calls[0]![0]).toBe('https://upload.example/sts')
  expect(mocks.post.mock.calls[0]![1].get('puid')).toBe('project-1')
  expect(OSS).toHaveBeenCalledTimes(1)
  const options = vi.mocked(OSS).mock.calls[0]![0]
  expect(options).toMatchObject({ endpoint: 'https://oss.example', bucket: 'bucket-test', region: 'oss-cn-beijing' })
  expect(mocks.multipartUpload).toHaveBeenCalledExactlyOnceWith('uploads/zh-fixed.png', file, {
    progress: expect.any(Function),
  })
  await expect(options.refreshSTSToken!()).resolves.toEqual({
    accessKeyId: 'refreshed-id',
    accessKeySecret: 'refreshed-secret',
    stsToken: 'refreshed-token',
  })
  expect(mocks.post).toHaveBeenCalledTimes(2)
  expect(mocks.post.mock.calls[1]![0]).toBe('https://upload.example/sts')
  expect(mocks.post.mock.calls[1]![1].get('puid')).toBe('project-1')
})
