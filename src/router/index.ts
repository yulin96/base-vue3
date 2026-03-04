import { ref } from 'vue'
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

// if (import.meta.hot) {
//   handleHotUpdate(router)
// }

router.addRoute({
  path: '/:pathMatch(.*)*',
  name: '404',
  redirect: '/',
  meta: { index: 404 },
})

router.beforeEach((to, from) => {
  // WeChat 登录拦截（按需启用）：
  // 仅当项目确实接入了 BaseWechatLogin / openid 体系时再打开此逻辑。
  // const { user } = useStore()
  // const { openid } = user.wxInfo
  // if (!openid && to.path !== '/') return { path: '/' }
})

export const routeHistory = ref({
  list: [] as (keyof RouteNamedMap)[],
  maxLimit: 10,
})

router.afterEach((to, from) => {
  routeHistory.value.list.unshift(to.name)

  if (routeHistory.value.list.length > routeHistory.value.maxLimit) {
    routeHistory.value.list.pop()
  }

  if (typeof window._hmt !== 'undefined') {
    window._hmt.push(['_trackPageview', `${location.pathname}#${to.fullPath}`])
  }
})

declare module 'vue-router' {
  interface RouteMeta {
    index?: number
    transitionName?: string
    needLogin?: boolean
    [x: string]: string | number | boolean | undefined
  }
}

export default router

declare global {
  interface Window {
    _hmt?: any
  }
}
