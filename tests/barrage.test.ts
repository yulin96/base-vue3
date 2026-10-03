import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Barrage from '@/components/effect/barrage.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.useRealTimers())

let to: ReturnType<typeof vi.fn>
let delayedCall: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  to = vi.fn(() => ({ kill: vi.fn() }))
  delayedCall = vi.fn(() => ({ kill: vi.fn() }))
  vi.stubGlobal('gsap', { to, delayedCall })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 200,
    bottom: 40,
    width: 100,
    height: 40,
    toJSON() {},
  })
})

test('空列表等待超过原重试上限后，新增弹幕仍能播放', async () => {
  const wrapper = mount(Barrage, { props: { row: 1, barrageList: [] } })
  wrapper.vm.start()
  await vi.advanceTimersByTimeAsync(13200)
  wrapper.vm.addCard({ id: 7, text: '后到的弹幕' })
  wrapper.vm.start()
  await nextTick()
  await vi.advanceTimersByTimeAsync(100)

  expect(wrapper.findAll('.card-item-7')).toHaveLength(1)
  expect(wrapper.text()).toContain('后到的弹幕')
  expect(to).toHaveBeenCalledTimes(1)
  expect(delayedCall).toHaveBeenCalledTimes(1)
})

test('外部列表在长时间为空后更新，自动唤醒播放通道', async () => {
  const wrapper = mount(Barrage, { props: { row: 1, barrageList: [] } })
  wrapper.vm.start()
  await vi.advanceTimersByTimeAsync(13200)
  await wrapper.setProps({ barrageList: [{ id: 8, text: '异步列表' }] })
  await vi.advanceTimersByTimeAsync(100)

  expect(wrapper.findAll('.card-item-8')).toHaveLength(1)
  expect(wrapper.text()).toContain('异步列表')
  expect(to).toHaveBeenCalledTimes(1)
})

test('重复 start 不会重复创建同一通道，卸载会清理动画和卡片', async () => {
  const wrapper = mount(Barrage, {
    props: { row: 1, barrageList: [{ id: 9, text: '正常弹幕' }] },
  })
  wrapper.vm.start()
  wrapper.vm.start()
  await nextTick()
  await vi.advanceTimersByTimeAsync(100)
  expect(wrapper.findAll('.card-item-9')).toHaveLength(1)
  expect(to).toHaveBeenCalledTimes(1)
  const element = wrapper.find('.card-item-9').element.parentElement!
  wrapper.unmount()
  expect(to.mock.results[0]!.value.kill).toHaveBeenCalledTimes(1)
  expect(delayedCall.mock.results[0]!.value.kill).toHaveBeenCalledTimes(1)
  expect(element.querySelector('.card-item-9')).toBeNull()
})

test('停止后到达的数据不会重新启动弹幕', async () => {
  const wrapper = mount(Barrage, { props: { row: 1, barrageList: [] } })
  wrapper.vm.start()
  await vi.advanceTimersByTimeAsync(2000)
  wrapper.vm.stop()
  wrapper.vm.addCard({ id: 10, text: '停止后的弹幕' })
  await wrapper.setProps({ barrageList: [{ id: 11, text: '停止后的列表' }] })
  await vi.advanceTimersByTimeAsync(20000)
  expect(wrapper.findAll('[class^="card-item-"]')).toHaveLength(0)
  expect(to).not.toHaveBeenCalled()
  expect(delayedCall).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})
