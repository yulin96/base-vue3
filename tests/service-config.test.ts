import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { loadEnv } from 'vite'
import type { InternalAxiosRequestConfig } from 'axios'

vi.mock('@/utils/request-signature', () => ({ isPostEncryptEnabled: false, createApiSignature: vi.fn() }))
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  // 使用浏览器 FormData，避免 Node 导出选择 form-data。
  return { ...actual, toFormData: (data: object) => actual.toFormData(data, new FormData()) }
})

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.stubEnv('VITE_APP_API_URL', 'https://c26.event1.cn/project')
  vi.stubEnv('VITE_APP_MQTT_API_URL', 'https://mqtt.example/send')
})
afterEach(() => vi.useRealTimers())

function createAdapter() {
  return vi.fn(async (config: InternalAxiosRequestConfig) => ({
    data: { code: 200, data: { ok: true } },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }))
}

test.each([
  { mode: 'development', envFiles: '.env + .env.development', url: 'https://c26-test.event1.cn/vdwins3c/sendMqtt' },
  { mode: 'production', envFiles: '.env', url: 'https://c26.event1.cn/vdwins3c/sendMqtt' },
  { mode: 'deploy', envFiles: '.env', url: 'https://c26.event1.cn/vdwins3c/sendMqtt' },
  { mode: 'deploy-test', envFiles: '.env', url: 'https://c26.event1.cn/vdwins3c/sendMqtt' },
])('$mode 使用 $envFiles 中的接口地址', async ({ mode, url }) => {
  vi.stubEnv('VITE_APP_API_URL', undefined)
  vi.stubEnv('VITE_APP_MQTT_API_URL', undefined)
  const env = loadEnv(mode, process.cwd(), ['VITE_APP_API_URL', 'VITE_APP_MQTT_API_URL'])
  vi.stubEnv('VITE_APP_API_URL', env.VITE_APP_API_URL)
  vi.stubEnv('VITE_APP_MQTT_API_URL', env.VITE_APP_MQTT_API_URL)
  const { services } = await import('@/config/services')
  expect(services.api.baseURL).toBe('')
  expect(services.mqtt.publishUrl).toBe(url)
})

test('进程中显式配置的地址优先于环境文件', async () => {
  const env = loadEnv('development', process.cwd(), ['VITE_APP_API_URL', 'VITE_APP_MQTT_API_URL'])
  expect(env.VITE_APP_API_URL).toBe('https://c26.event1.cn/project')
  expect(env.VITE_APP_MQTT_API_URL).toBe('https://mqtt.example/send')
})

test('业务请求直接使用配置地址，不自动替换域名', async () => {
  const { axiosGet } = await import('@/utils/request')
  const adapter = createAdapter()
  const signal = new AbortController().signal
  await expect(axiosGet('/list', { page: 2 }, { adapter, signal, timeout: 1000 })).resolves.toEqual({
    code: 200,
    data: { ok: true },
  })
  expect(adapter).toHaveBeenCalledTimes(1)
  expect(adapter.mock.calls[0]![0]).toMatchObject({
    baseURL: 'https://c26.event1.cn/project',
    url: '/list',
    params: { page: 2 },
    signal,
    timeout: 1000,
  })
})

test('业务基础地址为空时保留同源相对请求', async () => {
  vi.stubEnv('VITE_APP_API_URL', '')
  const { axiosGet } = await import('@/utils/request')
  const adapter = createAdapter()
  await axiosGet('/list', undefined, { adapter })
  expect(adapter.mock.calls[0]![0]).toMatchObject({ baseURL: '', url: '/list' })
})

test('配置调整后 POST 的 FormData 转换仍然生效', async () => {
  const { axiosPost } = await import('@/utils/request')
  const adapter = createAdapter()
  await axiosPost('/submit', { id: '001' }, { adapter }, 'FormData')
  const config = adapter.mock.calls[0]![0]
  expect(config.baseURL).toBe('https://c26.event1.cn/project')
  expect(config.data).toBeInstanceOf(FormData)
  expect([...config.data.entries()]).toEqual([['id', '001']])
})

test('MQTT 发送使用独立配置地址，保留频道与请求配置透传', async () => {
  const { apiSendMqtt } = await import('@/api/mqtt')
  const adapter = createAdapter()
  const signal = new AbortController().signal
  await expect(apiSendMqtt('channel', { command: 'go', channel: 'wrong' }, { adapter, signal })).resolves.toEqual([
    null,
    { code: 200, data: { ok: true } },
  ])
  expect(adapter).toHaveBeenCalledTimes(1)
  const config = adapter.mock.calls[0]![0]
  expect(config.url).toBe('https://mqtt.example/send')
  expect(config.signal).toBe(signal)
  expect(JSON.parse(config.data)).toEqual({ command: 'go', channel: 'channel' })
})
