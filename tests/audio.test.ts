import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import Audio from '@/components/media/audio.vue'

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

test('卸载前暂停真实模板中的 audio 并清空 src，移除 document 监听', () => {
  const wrapper = mount(Audio, { props: { src: '/music.mp3' }, global: { stubs: { teleport: true } } })
  const audio = wrapper.get('audio').element
  const pause = vi.spyOn(audio, 'pause')
  const play = vi.spyOn(audio, 'play')
  wrapper.unmount()
  expect(pause).toHaveBeenCalledTimes(1)
  expect(audio.getAttribute('src')).toBe('')
  document.dispatchEvent(new Event('WeixinJSBridgeReady'))
  document.dispatchEvent(new MouseEvent('click'))
  document.dispatchEvent(new Event('touchend'))
  expect(play).not.toHaveBeenCalled()
})

test('微信桥播放成功后撤销首次触摸和点击播放监听', async () => {
  const wrapper = mount(Audio, { props: { src: '/music.mp3' }, global: { stubs: { teleport: true } } })
  document.dispatchEvent(new Event('WeixinJSBridgeReady'))
  await flushPromises()
  document.dispatchEvent(new MouseEvent('click'))
  document.dispatchEvent(new Event('touchend'))
  expect(wrapper.get('audio').element.play).toHaveBeenCalledTimes(1)
})
