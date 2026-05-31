import router from '@/router'
import type { RouteLocationRaw } from 'vue-router'

const storageName = import.meta.env.VITE_APP_LOCALSTORAGE_NAME || 'test'
const HISTORY_KEY = `${storageName}ROUTER_HISTORY_STACK`.toUpperCase()
const MAX_HISTORY = 50

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

export const replaceTo = (path: RouteLocationRaw, replaceCurrent = false) => {
  const stack = getHistoryStack()

  if (replaceCurrent && stack.length > 0) {
    stack[stack.length - 1] = router.currentRoute.value.fullPath
  } else {
    stack.push(router.currentRoute.value.fullPath)
  }

  if (stack.length > MAX_HISTORY) stack.shift()
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

  return router.replace({ name: '/' })
}
