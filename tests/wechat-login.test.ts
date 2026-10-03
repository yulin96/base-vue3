import { afterEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import WechatLogin from '@/components/platform/wechat-login.vue'

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), getOpenId: vi.fn().mockResolvedValue(false) }))
vi.mock('@/utils/navigation', () => ({ toUrl: mocks.navigate }))
vi.mock('@/utils/platform/getOpenId', () => ({ getOpenId: mocks.getOpenId }))
vi.mock('@/config/services', () => ({
  services: { wechat: { codeUrl: 'https://wechat.example/code', name: 'platform & name' } },
}))

enableAutoUnmount(afterEach)

test('微信登录读取授权地址及平台名称，并保留跳转参数', async () => {
  const wrapper = mount(WechatLogin, {
    props: { url: 'https://activity.example/path?id=1#hash' },
    global: { stubs: { VanPopup: { template: '<div><slot /></div>' } } },
  })
  await flushPromises()
  await wrapper.find('.h-80').trigger('click')
  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(
    'https://wechat.example/code?name=platform%20%26%20name&action=1&cUrl=https%3A%2F%2Factivity.example%2Fpath%3Fid%3D1%23hash',
  )
})
