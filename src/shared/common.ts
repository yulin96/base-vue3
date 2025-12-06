import router from '@/router'
import { type ClassValue, clsx } from 'clsx'
import { debounce } from 'es-toolkit'
import { twMerge } from 'tailwind-merge'
import type { RouteLocationRaw } from 'vue-router'

/**
 * 创建一个防抖函数，在首次触发时立即执行，后续在指定时间内忽略重复调用。
 * @template F 函数类型
 * @param fn 需要防抖处理的函数
 * @param time 防抖间隔时间（毫秒），默认 600ms
 * @returns 防抖处理后的新函数
 */
export function debounceLeading<F extends (...args: any[]) => void>(fn: F, time = 600) {
  return debounce(fn, time, { edges: ['leading'] })
}

/**
 * 路由跳转到指定地址（使用 replace 模式，不会新增历史记录）。
 * @param to 目标路由地址
 * @returns 路由跳转的 Promise
 */
export function redirectTo(to: RouteLocationRaw) {
  return router.replace(to)
}

/**
 * 延迟指定的时间
 * @param time 延迟的时间（以毫秒为单位）
 * @returns 一个 Promise，在指定的时间后解析
 */
export function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, time)
  })
}

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ObjectValues<T> = T[keyof T]

// 导出从 utils 迁移的函数，保持向后兼容
export {
  isChineseLanguage,
  isEnglishLanguage,
  isSimplifiedChinese,
  isTraditionalChinese,
  getUserLanguage as userLanguage,
} from '@/utils/browser/language'

export { removeUrlParams } from '@/utils/browser/url'
