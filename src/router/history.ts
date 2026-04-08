import type { RouterNameOrPath } from '@/router'
import type { RouteLocationRaw } from 'vue-router'

export const historyStack = {
  stack: [] as RouterNameOrPath[],
  isBack: false,

  record(path: RouterNameOrPath) {
    if (this.isBack) {
      this.isBack = false
      return
    }
    const index = this.stack.indexOf(path)
    if (index !== -1) {
      this.stack = this.stack.slice(0, index + 1)
    } else {
      this.stack.push(path)
    }
  },

  getPrevPath() {
    if (this.stack.length > 1) {
      this.stack.pop()
      this.isBack = true
      return this.stack[this.stack.length - 1]
    }
    return null
  },

  async goTo(path: RouteLocationRaw) {
    const { default: router } = await import('@/router')
    return router.replace(path)
  },

  async goBack(path?: RouteLocationRaw) {
    const { default: router } = await import('@/router')
    if (path) {
      this.isBack = true
      return router.replace(path)
    }
    const prev = this.getPrevPath()
    return router.replace(prev || '/')
  },
}
