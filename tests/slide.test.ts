import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useSlide } from '@/hooks/interaction/useSlide'

enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100)
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(500)
})

async function setup(scrollTop: number) {
  const prev = vi.fn()
  const next = vi.fn()
  const prevScroll = vi.fn()
  const nextScroll = vi.fn()
  const wrapper = mount(
    defineComponent({
      setup() {
        const { key } = useSlide({ prev, next, prevScroll, nextScroll })
        return () => h('div', { ref: key, style: { overflowY: 'auto' } })
      },
    }),
  )
  wrapper.element.scrollTop = scrollTop
  await nextTick()
  wrapper.element.dispatchEvent(new Event('scroll'))
  await nextTick()
  const touch = (type: string, pageY: number) => {
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'touches', { value: [{ pageY }] })
    wrapper.element.dispatchEvent(event)
    return event
  }
  return { prev, next, prevScroll, nextScroll, touch }
}

test.each([
  { edge: '顶部向上', scrollTop: 0, from: 150, to: 20, expectedPrev: 0, expectedNext: 0 },
  { edge: '底部向下', scrollTop: 400, from: 20, to: 150, expectedPrev: 0, expectedNext: 0 },
  { edge: '中间向上', scrollTop: 200, from: 150, to: 20, expectedPrev: 0, expectedNext: 0 },
  { edge: '中间向下', scrollTop: 200, from: 20, to: 150, expectedPrev: 0, expectedNext: 0 },
  { edge: '顶部向下', scrollTop: 0, from: 20, to: 150, expectedPrev: 1, expectedNext: 0 },
  { edge: '底部向上', scrollTop: 400, from: 150, to: 20, expectedPrev: 0, expectedNext: 1 },
])('$edge：只在越过对应边界时切页', async ({ scrollTop, from, to, expectedPrev, expectedNext }) => {
  const { touch, prev, next, prevScroll, nextScroll } = await setup(scrollTop)
  touch('touchstart', from)
  const move = touch('touchmove', to)
  touch('touchmove', to)
  expect(prev).toHaveBeenCalledTimes(expectedPrev)
  expect(next).toHaveBeenCalledTimes(expectedNext)
  expect(move.defaultPrevented).toBe(expectedPrev + expectedNext === 1)
  expect(prevScroll).not.toHaveBeenCalled()
  expect(nextScroll).not.toHaveBeenCalled()
})

test('边界内正常滚动不触发切页进度回调', async () => {
  const { touch, prevScroll, nextScroll } = await setup(0)
  touch('touchstart', 100)
  touch('touchmove', 40)
  expect(prevScroll).not.toHaveBeenCalled()
  expect(nextScroll).not.toHaveBeenCalled()
})
