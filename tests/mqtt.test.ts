import { afterEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useMqtt, type UseMqttOptions } from '@/hooks/network/useMqtt'

vi.mock('@/config/services', () => ({
  services: { mqtt: { pub: 'default-pub', sub: 'default-sub', scriptUrl: 'https://mqtt.example/client.js' } },
}))

enableAutoUnmount(afterEach)
afterEach(() => {
  delete window.ROP
  document.querySelectorAll('script[data-rop-client-script="true"]').forEach((script) => script.remove())
  vi.useRealTimers()
})

async function setup(options: UseMqttOptions = { autoReconnectOnVisibility: false }, clientLoaded = true) {
  const handlers = new Map<string, (...args: any[]) => void>()
  const api = {
    On: vi.fn((event: string, callback: (...args: any[]) => void) => {
      handlers.set(event, callback)
    }),
    Enter: vi.fn(),
    Subscribe: vi.fn(),
    Publish: vi.fn(),
  }
  if (clientLoaded) window.ROP = api
  const onMessage = vi.fn()
  const wrapper = mount(
    defineComponent({
      setup() {
        const client = useMqtt('channel', onMessage, options)
        return client
      },
      template: '<div />',
    }),
  )
  await flushPromises()
  const emit = (message: unknown, channel = 'channel') => handlers.get('publish_data')!(message, channel)
  return { wrapper, api, onMessage, emit, handlers }
}

test.each(['go', '1', 'false', '{"action":"go"}'])('连续相同消息逐条回调：%s', async (message) => {
  const { emit, onMessage } = await setup()
  emit(message)
  emit(message)
  expect(onMessage).toHaveBeenCalledTimes(2)
  expect(onMessage.mock.calls[0]).toEqual(onMessage.mock.calls[1])
})

test('过滤其他频道，解析 JSON 并更新最新数据', async () => {
  const { emit, onMessage, wrapper } = await setup()
  emit('{"count":1}', 'other')
  expect(onMessage).not.toHaveBeenCalled()
  emit('{"count":2}')
  expect(onMessage).toHaveBeenCalledWith({ count: 2 })
  expect(wrapper.vm.data).toEqual({ count: 2 })
})

test('客户端缺少 Off 时，卸载后的迟到消息也不会回调', async () => {
  const { wrapper, emit, onMessage } = await setup()
  wrapper.unmount()
  emit('late')
  expect(onMessage).not.toHaveBeenCalled()
})

test.each(['enter_suc', 'reconnect', 'offline', 'enter_fail', 'losed'])(
  '客户端缺少 Off 时，卸载后的 %s 不改变状态或订阅',
  async (event) => {
    const { wrapper, api, handlers } = await setup()
    const stateBeforeUnmount = wrapper.vm.connectionStatus
    wrapper.unmount()
    handlers.get(event)!('late')
    expect(wrapper.vm.connectionStatus).toBe(stateBeforeUnmount)
    expect(api.Subscribe).not.toHaveBeenCalled()
    expect(api.Enter).toHaveBeenCalledTimes(1)
  },
)

test('卸载移除可见性监听，恢复可见不会再连接', async () => {
  const addListener = vi.spyOn(document, 'addEventListener')
  const removeListener = vi.spyOn(document, 'removeEventListener')
  const { wrapper, api } = await setup({ autoReconnectOnVisibility: true })
  const visibilityListeners = addListener.mock.calls.filter(([event]) => event === 'visibilitychange')
  expect(visibilityListeners).toHaveLength(1)
  wrapper.unmount()
  expect(removeListener).toHaveBeenCalledWith(...visibilityListeners[0]!)
  document.dispatchEvent(new Event('visibilitychange'))
  await flushPromises()
  expect(api.Enter).toHaveBeenCalledTimes(1)
})

test('连接使用集中配置的默认 pub/sub', async () => {
  const { api, handlers } = await setup()
  expect(api.Enter).toHaveBeenCalledExactlyOnceWith('default-pub', 'default-sub', expect.stringMatching(/^suid_/), true)
  handlers.get('enter_suc')!()
  expect(api.Subscribe).toHaveBeenCalledExactlyOnceWith('channel')
})

test('useMqtt 透传项目 pub/sub，保留去空白行为', async () => {
  const { api, handlers } = await setup({
    pub: ' project-pub ',
    sub: ' project-sub ',
    autoReconnectOnVisibility: false,
  })
  expect(api.Enter).toHaveBeenCalledExactlyOnceWith('project-pub', 'project-sub', expect.stringMatching(/^suid_/), true)
  handlers.get('enter_suc')!()
  expect(api.Subscribe).toHaveBeenCalledExactlyOnceWith('channel')
})

test('客户端尚未加载时使用集中配置的脚本地址', async () => {
  vi.useFakeTimers()
  const { api } = await setup({ autoReconnectOnVisibility: false }, false)
  const script = document.querySelector<HTMLScriptElement>('script[data-rop-client-script="true"]')
  expect(script?.src).toBe('https://mqtt.example/client.js')
  window.ROP = api
  script!.dispatchEvent(new Event('load'))
  await flushPromises()
  expect(api.Enter).toHaveBeenCalledExactlyOnceWith('default-pub', 'default-sub', expect.stringMatching(/^suid_/), true)
  expect(vi.getTimerCount()).toBe(0)
})
