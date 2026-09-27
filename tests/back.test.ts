import { afterEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import Back from '@/components/common/back.vue'

const mocks = vi.hoisted(() => ({ goBack: vi.fn(), isPcMode: vi.fn() }))
vi.mock('@/router', () => ({ goBack: mocks.goBack }))
vi.mock('@/stores/user', () => ({ useStore: () => ({ user: { backXY: { x: 10, y: 10 } } }) }))
vi.mock('@/utils/platform/ua', () => ({ isPcMode: mocks.isPcMode }))
enableAutoUnmount(afterEach)

test.each([true, false])('返回按钮不传参数走历史，传 back 时指定目标（PC=%s）', async (pc) => {
  mocks.isPcMode.mockReturnValue(pc)
  const wrapper = mount(Back, {
    global: { stubs: { 'van-floating-bubble': { template: '<button><slot /></button>' } } },
  })
  await wrapper.get('[btn]').trigger('click')
  expect(mocks.goBack).toHaveBeenLastCalledWith(undefined)
  await wrapper.setProps({ back: '/' })
  await wrapper.get('[btn]').trigger('click')
  expect(mocks.goBack).toHaveBeenLastCalledWith({ name: '/' })
  expect(mocks.goBack).toHaveBeenCalledTimes(2)
})
