import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/utils/dom/createQRCode', () => ({ createQRCode: vi.fn(), removeQRCode: vi.fn() }))

let viewport: EventTarget & { height: number; scale: number }
let removeListeners: () => void

beforeEach(async () => {
  vi.useFakeTimers()
  vi.resetModules()
  vi.stubGlobal('innerWidth', 390)
  vi.stubGlobal('innerHeight', 800)
  viewport = Object.assign(new EventTarget(), { height: 800, scale: 1 })
  vi.stubGlobal('visualViewport', viewport)
  document.body.innerHTML = '<div id="app"><input /><input type="checkbox" /></div>'
  const windowEvents = vi.spyOn(window, 'addEventListener')
  const documentEvents = vi.spyOn(document, 'addEventListener')
  const viewportEvents = vi.spyOn(viewport, 'addEventListener')
  removeListeners = () => {
    for (const [type, listener] of windowEvents.mock.calls) window.removeEventListener(type, listener)
    for (const [type, listener] of documentEvents.mock.calls) document.removeEventListener(type, listener)
    for (const [type, listener] of viewportEvents.mock.calls) viewport.removeEventListener(type, listener)
  }
  await import('@/plugins/setup/setRem')
  document.dispatchEvent(new Event('DOMContentLoaded'))
})

afterEach(() => {
  removeListeners()
  vi.clearAllTimers()
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('style')
})

function resize(height: number, visualOnly = false) {
  viewport.height = height
  if (!visualOnly) vi.stubGlobal('innerHeight', height)
  ;(visualOnly ? viewport : window).dispatchEvent(new Event('resize'))
  vi.advanceTimersByTime(150)
}

function appHeight() {
  return document.documentElement.style.getPropertyValue('--app-height')
}

test('普通底栏出现与收起更新高度，包括仅可视视口变化', () => {
  resize(710, true)
  expect(appHeight()).toBe('710px')
  resize(800, true)
  expect(appHeight()).toBe('800px')
  resize(500)
  expect(appHeight()).toBe('500px')
})

test.each([false, true])('键盘保持布局，失焦后等待键盘收起（visualOnly=%s）', (visualOnly) => {
  document.querySelector('input')!.focus()
  resize(480, visualOnly)
  expect(appHeight()).toBe('800px')
  document.querySelector('input')!.blur()
  vi.advanceTimersByTime(150)
  expect(appHeight()).toBe('800px')
  resize(710, visualOnly)
  expect(appHeight()).toBe('710px')
})

test('聚焦时普通 90px 高度变化仍更新，键盘关闭不要求失焦', () => {
  document.querySelector('input')!.focus()
  resize(710)
  expect(appHeight()).toBe('710px')
  resize(480)
  expect(appHeight()).toBe('800px')
  resize(800)
  expect(appHeight()).toBe('800px')
})

test('非文本控件不触发键盘锁定', () => {
  document.querySelector<HTMLInputElement>('input[type="checkbox"]')!.focus()
  resize(480)
  expect(appHeight()).toBe('480px')
})

test('宽度变化重置旧高度，PC 预览继续随窗口适配', () => {
  document.querySelector('input')!.focus()
  resize(480)
  vi.stubGlobal('innerWidth', 650)
  resize(390)
  expect(appHeight()).toBe('390px')
  vi.stubGlobal('innerWidth', 1200)
  resize(900)
  expect(document.querySelector<HTMLElement>('#app')!.style.height).toBe('900px')
  resize(600)
  expect(appHeight()).toBe('600px')
})
