import { createRouter, createWebHashHistory, type RouteLocationRaw } from 'vue-router'
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

router.afterEach((to, from) => {
  if (typeof window._hmt !== 'undefined') {
    window._hmt.push(['_trackPageview', `${location.pathname}#${to.fullPath}`])
  }
})

export type RouterNameOrPath = keyof RouteNamedMap | (string & {})

const HISTORY_KEY = (import.meta.env.VITE_APP_LOCALSTORAGE_NAME + 'ROUTER_HISTORY_STACK').toUpperCase()

const getHistoryStack = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

const setHistoryStack = (stack: string[]) => {
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(stack))
}

export const replaceTo = (path: RouteLocationRaw) => {
  const stack = getHistoryStack()
  stack.push(router.currentRoute.value.fullPath)
  setHistoryStack(stack)
  return router.replace(path)
}

export const goBack = (fallbackPath?: RouteLocationRaw) => {
  const stack = getHistoryStack()

  if (stack.length > 0) {
    const prevPath = stack.pop()!
    setHistoryStack(stack)
    return router.replace(prevPath)
  }

  if (fallbackPath) {
    return router.replace(fallbackPath)
  }

  return router.replace('/home')
}

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
