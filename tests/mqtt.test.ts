import { afterEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useMqtt } from '@/hooks/network/useMqtt'

enableAutoUnmount(afterEach)
afterEach(() => {
  delete window.ROP
})

async function setup() {
  const handlers = new Map<string, (...args: any[]) => void>()
  const api = {
    On: vi.fn((event: string, callback: (...args: any[]) => void) => {
      handlers.set(event, callback)
    }),
    Enter: vi.fn(),
    Subscribe: vi.fn(),
    Publish: vi.fn(),
  }
  window.ROP = api
  const onMessage = vi.fn()
  const wrapper = mount(
    defineComponent({
      setup() {
        const client = useMqtt('channel', onMessage, { autoReconnectOnVisibility: false })
        return client
      },
      template: '<div />',
    }),
  )
  await flushPromises()
  const emit = (message: unknown, channel = 'channel') => handlers.get('publish_data')!(message, channel)
  return { wrapper, api, onMessage, emit }
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
