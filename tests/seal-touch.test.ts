import { afterEach, expect, test } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import SealTouch from '@/components/form/seal-touch.vue'

enableAutoUnmount(afterEach)

function setup() {
  const wrapper = mount(SealTouch, { global: { stubs: { FormKeyboard: true } } })
  const surface = wrapper.find('div.z-10')
  const start = (points: Array<{ clientX: number; clientY: number }>) =>
    surface.trigger('touchstart', { changedTouches: points, touches: points })
  return { wrapper, surface, start }
}

test('取消的触摸坐标不会计入下一次盖章', async () => {
  const { wrapper, surface, start } = setup()
  await start([
    { clientX: 1, clientY: 2 },
    { clientX: 3, clientY: 4 },
    { clientX: 5, clientY: 6 },
  ])
  await surface.trigger('touchcancel')
  await start([
    { clientX: 10, clientY: 20 },
    { clientX: 30, clientY: 40 },
  ])
  expect(wrapper.emitted('next')).toBeUndefined()

  await surface.trigger('touchend')
  await start([
    { clientX: 10, clientY: 20 },
    { clientX: 30, clientY: 40 },
    { clientX: 50, clientY: 60 },
    { clientX: 70, clientY: 80 },
    { clientX: 90, clientY: 100 },
  ])
  expect(wrapper.emitted('next')).toEqual([
    [
      'stamp',
      JSON.stringify([
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
        { x: 70, y: 80 },
        { x: 90, y: 100 },
      ]),
    ],
  ])
})

test('正常分批触摸五个点仍只触发一次盖章', async () => {
  const { wrapper, start } = setup()
  await start([
    { clientX: 1, clientY: 2 },
    { clientX: 3, clientY: 4 },
    { clientX: 5, clientY: 6 },
  ])
  await start([
    { clientX: 7, clientY: 8 },
    { clientX: 9, clientY: 10 },
  ])
  expect(wrapper.emitted('next')).toEqual([
    ['stamp', '[{"x":1,"y":2},{"x":3,"y":4},{"x":5,"y":6},{"x":7,"y":8},{"x":9,"y":10}]'],
  ])
})
