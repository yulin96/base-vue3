import { appStorageName } from '@/config/env'
import router from '@/router'
import type { RouteLocationRaw } from 'vue-router'

const HISTORY_KEY = `${appStorageName}ROUTER_HISTORY_STACK`.toUpperCase()
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

export const replaceTo = async (path: RouteLocationRaw, replaceCurrent = false) => {
  const fromPath = router.currentRoute.value.fullPath
  const failure = await router.replace(path)
  if (failure) return failure

  const stack = getHistoryStack()

  if (replaceCurrent && stack.length > 0) {
    stack[stack.length - 1] = fromPath
  } else {
    stack.push(fromPath)
  }

  if (stack.length > MAX_HISTORY) stack.shift()
  setHistoryStack(stack)
}

/** 不传目标时返回上一页；指定目标成功后回退对应历史，目标不在栈中则清空历史。 */
export const goBack = async (target?: RouteLocationRaw) => {
  const stack = getHistoryStack()

  if (target !== undefined) {
    const failure = await router.replace(target)
    if (failure) return failure

    const targetIndex = stack.lastIndexOf(router.currentRoute.value.fullPath)
    setHistoryStack(targetIndex >= 0 ? stack.slice(0, targetIndex) : [])
    return
  }

  const originalLength = stack.length
  const currentPath = router.currentRoute.value.fullPath

  while (stack.length > 0 && stack[stack.length - 1] === currentPath) {
    stack.pop()
  }
  if (stack.length !== originalLength) setHistoryStack(stack)

  if (stack.length > 0) {
    const prevPath = stack[stack.length - 1]
    const failure = await router.replace(prevPath)
    if (failure) return failure

    stack.pop()
    setHistoryStack(stack)
    return
  }

  return router.replace({ name: '/' })
}
