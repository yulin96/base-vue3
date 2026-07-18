import { createRouter, createWebHashHistory } from 'vue-router'
import { routes, type RouteNamedMap } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: routes,
  scrollBehavior(to, from, savedPosition) {
    return {
      top: 0,
    }
  },
})

router.addRoute({
  path: '/:pathMatch(.*)*',
  name: '404',
  redirect: '/',
  meta: { index: 404 },
})

router.beforeEach((to, from) => {
  // WeChat 登录拦截（按需启用）：
  // 仅当项目确实接入了 PlatformWechatLogin / openid 体系时再打开此逻辑。
  // const { user } = useStore()
  // const { openid } = user.wxInfo
  // if (!openid && to.path !== '/') return { path: '/' }
})

router.afterEach((to, from) => {
  if (typeof window._hmt !== 'undefined') {
    window._hmt.push(['_trackPageview', `${location.pathname}#${to.fullPath}`])
  }
})

export type RouterNameOrPath = keyof RouteNamedMap | (string & {})
export { goBack, replaceTo } from './history'

declare module 'vue-router' {
  interface RouteMeta {
    index?: number
    keepAlive?: boolean
    transitionName?: string
    needLogin?: boolean
    [x: string]: string | number | boolean | undefined
  }
}

export default router
