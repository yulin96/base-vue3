import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import FrameAnimation, { type FrameAnimationOption } from '@/utils/animation/legacy/frameAnimation'

let animations: FrameAnimation[]
let scheduledFrames: Map<number, FrameRequestCallback>
let frameId: number
let time: number
let drawImage: ReturnType<typeof vi.fn>

beforeEach(() => {
  animations = []
  scheduledFrames = new Map()
  frameId = 0
  time = 0
  drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: vi.fn(),
    drawImage,
  } as unknown as CanvasRenderingContext2D)
  vi.stubGlobal('Image', function () {
    const image = document.createElement('img')
    queueMicrotask(() => image.dispatchEvent(new Event('load')))
    return image
  })
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    scheduledFrames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => scheduledFrames.delete(id))
})
afterEach(() => animations.forEach((animation) => animation.destroy()))

async function setup(options: Partial<FrameAnimationOption>) {
  const animation = new FrameAnimation({
    el: document.createElement('canvas'),
    urlPrefix: '/frames/',
    urlSuffix: '.png',
    maxLength: 2,
    fps: 10,
    autoPlay: false,
    ...options,
  })
  animations.push(animation)
  await flushPromises()
  expect(animation.canPlay).toBe(true)
  return animation
}

function advanceFrames(count: number) {
  for (let i = 0; i < count; i++) {
    time += 100
    const callbacks = [...scheduledFrames.values()]
    scheduledFrames.clear()
    callbacks.forEach((callback) => callback(time))
  }
}

test.each([undefined, 3])('loop=false 完整播放一次即停止，loopNum=%s', async (loopNum) => {
  const animation = await setup({ loop: false, loopNum })
  animation.play()
  advanceFrames(6)
  expect(animation.isPlay).toBe(false)
  expect(animation.cycles).toBe(1)
  expect(drawImage).toHaveBeenCalledTimes(2)
  expect(scheduledFrames.size).toBe(0)
})

test('默认循环仍持续播放，stop 清理动画', async () => {
  const animation = await setup({})
  animation.play()
  advanceFrames(6)
  expect(animation.isPlay).toBe(true)
  expect(animation.cycles).toBe(3)
  expect(drawImage).toHaveBeenCalledTimes(6)
  animation.stop()
  expect(scheduledFrames.size).toBe(0)
  expect(animation.cycles).toBe(0)
})

test('指定两次循环时，在第二次结束后停止', async () => {
  const animation = await setup({ loop: true, loopNum: 2 })
  animation.play()
  advanceFrames(6)
  expect(animation.isPlay).toBe(false)
  expect(animation.cycles).toBe(2)
  expect(drawImage).toHaveBeenCalledTimes(4)
  expect(scheduledFrames.size).toBe(0)
})
