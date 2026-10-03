import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useCanvasFrameAnimation, type FrameAnimationOptions } from '@/hooks/animation/useCanvasFrameAnimation'

enableAutoUnmount(afterEach)

let loadingImages: HTMLImageElement[]
let scheduledFrames: Map<number, FrameRequestCallback>
let frameId: number
let time: number
let drawImage: ReturnType<typeof vi.fn>

beforeEach(() => {
  loadingImages = []
  scheduledFrames = new Map()
  frameId = 0
  time = 0
  drawImage = vi.fn()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(performance, 'now').mockImplementation(() => time)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: vi.fn(),
    drawImage,
  } as unknown as CanvasRenderingContext2D)
  vi.stubGlobal('Image', function () {
    const image = document.createElement('img')
    image.width = image.height = 100
    loadingImages.push(image)
    return image
  })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    scheduledFrames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => scheduledFrames.delete(id))
})

function setup(options: Partial<FrameAnimationOptions> = {}) {
  let animation!: ReturnType<typeof useCanvasFrameAnimation>
  const wrapper = mount(
    defineComponent({
      setup() {
        animation = useCanvasFrameAnimation({ frames: ['0.png', '1.png', '2.png', '3.png'], fps: 10, ...options })
        return () => h('canvas', { ref: animation.key, style: { width: '100px', height: '100px' } })
      },
    }),
  )
  return { animation, wrapper }
}

function finishLoading(result: 'load' | 'error') {
  while (loadingImages.length) loadingImages.shift()!.dispatchEvent(new Event(result))
}

function advanceFrame() {
  time += 100
  const callbacks = [...scheduledFrames.values()]
  scheduledFrames.clear()
  callbacks.forEach((callback) => callback(time))
}

test('全部帧加载失败时终止播放并结束等待，不调用完成回调', async () => {
  const { animation } = setup()
  const onComplete = vi.fn()
  let settled = false
  const playback = animation.play(0, onComplete).then(() => {
    settled = true
  })
  finishLoading('error')
  await flushPromises()

  expect(animation.state.isLoaded).toBe(false)
  expect(animation.state.isPlaying).toBe(false)
  expect(scheduledFrames.size).toBe(0)
  expect(settled).toBe(true)
  expect(onComplete).not.toHaveBeenCalled()
  await playback
})

test('全部帧加载失败后显式预加载可重新尝试', async () => {
  const { animation } = setup()
  const preload = animation.preloadImages()
  finishLoading('error')
  await expect(preload).rejects.toThrow('Failed to load any frame')

  const retry = animation.preloadImages()
  expect(loadingImages).toHaveLength(4)
  const expectedImages = [...loadingImages]
  finishLoading('load')
  const images = await retry
  expect(images).toEqual(expectedImages)
  expect(animation.state.isLoaded).toBe(true)
  expect(animation.state.isPlaying).toBe(false)
})

test('部分帧失败时仍可播放，并只完成一次', async () => {
  const { animation } = setup()
  loadingImages.shift()!.dispatchEvent(new Event('load'))
  finishLoading('error')
  await flushPromises()
  expect(animation.state.isLoaded).toBe(true)

  const onComplete = vi.fn()
  const playback = animation.play(0, onComplete)
  await flushPromises()
  advanceFrame()
  advanceFrame()
  advanceFrame()
  await playback
  expect(animation.state.currentFrame).toBe(3)
  expect(animation.state.isPlaying).toBe(false)
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(scheduledFrames.size).toBe(0)
})

test.each(['play', 'playToFrame', 'playFromToFrame'] as const)(
  '加载中 stop 能取消 %s，之后新播放仍可正常完成',
  async (method) => {
    const { animation } = setup()
    const onComplete = vi.fn()
    const playback =
      method === 'playFromToFrame'
        ? animation.playFromToFrame(2, 3, onComplete)
        : method === 'play'
          ? animation.play(0, onComplete)
          : animation.playToFrame(3, onComplete)
    animation.stop()
    finishLoading('load')
    await flushPromises()
    expect(animation.state.isPlaying).toBe(false)
    expect(animation.state.currentFrame).toBe(0)
    expect(scheduledFrames.size).toBe(0)
    expect(onComplete).not.toHaveBeenCalled()
    await playback

    const restarted = animation.play(2, onComplete)
    await flushPromises()
    advanceFrame()
    await restarted
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(animation.state.currentFrame).toBe(3)
  },
)

test('加载中 pause 取消等待中的播放', async () => {
  const { animation } = setup()
  const onComplete = vi.fn()
  const playback = animation.play(0, onComplete)
  animation.pause()
  finishLoading('load')
  await flushPromises()
  expect(animation.state.isPlaying).toBe(false)
  expect(scheduledFrames.size).toBe(0)
  expect(onComplete).not.toHaveBeenCalled()
  await playback
})

test('加载中 stop 不会被自动播放重新启动', async () => {
  const { animation } = setup({ autoplay: true })
  animation.stop()
  finishLoading('load')
  await flushPromises()
  expect(animation.state.isLoaded).toBe(true)
  expect(animation.state.isPlaying).toBe(false)
  expect(scheduledFrames.size).toBe(0)
})

test('自动播放从 startFrame 开始，并正常结束', async () => {
  const { animation } = setup({ autoplay: true, startFrame: 2 })
  finishLoading('load')
  await flushPromises()
  expect(animation.state.currentFrame).toBe(2)
  expect(animation.state.isPlaying).toBe(true)
  advanceFrame()
  await flushPromises()
  expect(animation.state.currentFrame).toBe(3)
  expect(animation.state.isPlaying).toBe(false)
  expect(scheduledFrames.size).toBe(0)
})

test('卸载取消等待中的播放和图片加载', async () => {
  const { animation, wrapper } = setup()
  const onComplete = vi.fn()
  const playback = animation.playFromToFrame(2, 3, onComplete)
  wrapper.unmount()
  finishLoading('load')
  await playback
  expect(animation.state.isPlaying).toBe(false)
  expect(animation.state.isLoaded).toBe(false)
  expect(scheduledFrames.size).toBe(0)
  expect(onComplete).not.toHaveBeenCalled()
})

test('预加载前指定起始帧，加载后从该帧开始并正常完成', async () => {
  const { animation } = setup()
  const onComplete = vi.fn()
  const playback = animation.goToAndPlay(2, onComplete)
  const expectedImage = loadingImages[2]
  finishLoading('load')
  await flushPromises()
  expect(animation.state.currentFrame).toBe(2)
  expect(animation.state.isPlaying).toBe(true)
  expect(drawImage.mock.lastCall?.[0]).toBe(expectedImage)

  advanceFrame()
  await playback
  expect(animation.state.currentFrame).toBe(3)
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(scheduledFrames.size).toBe(0)
})

test('资源已加载时 goToAndPlay 仍立即跳转到指定帧', async () => {
  const { animation } = setup()
  finishLoading('load')
  await flushPromises()
  const playback = animation.goToAndPlay(2)
  expect(animation.state.currentFrame).toBe(2)
  await flushPromises()
  advanceFrame()
  await playback
  expect(animation.state.currentFrame).toBe(3)
  expect(animation.state.isPlaying).toBe(false)
})
