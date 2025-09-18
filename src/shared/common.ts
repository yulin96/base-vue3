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
export function routerTo(to: RouteLocationRaw) {
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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ObjectValues<T> = T[keyof T]

/**
 * 获取用户的浏览器语言设置
 * @returns 用户的浏览器语言设置
 */
export function userLanguage(): string {
  return navigator?.language || (Array.isArray(navigator?.languages) && navigator?.languages?.[0]) || 'zh-CN'
}

/**
 * 检查用户语言是否为中文
 * @returns 如果用户语言为中文则返回true，否则返回false
 */
export function isChineseLanguage(): boolean {
  return userLanguage().startsWith('zh')
}

/**
 * 检查用户语言是否为简体中文
 * @returns 如果用户语言为简体中文则返回true，否则返回false
 */
export function isSimplifiedChinese(): boolean {
  return userLanguage() === 'zh-CN' || userLanguage() === 'zh-Hans'
}

/**
 * 检查用户语言是否为繁体中文
 * @returns 如果用户语言为繁体中文则返回true，否则返回false
 */
export function isTraditionalChinese(): boolean {
  return isChineseLanguage() && !isSimplifiedChinese()
}

/**
 * 检查用户语言是否为英语
 * @returns 如果用户语言为英语则返回true，否则返回false
 */
export function isEnglishLanguage(): boolean {
  return userLanguage().startsWith('en')
}

/**
 * 从URL中删除指定的参数
 * @param url 要处理的URL字符串
 * @param params 要删除的参数名称或参数名称数组
 * @returns 处理后的URL字符串
 */
export function removeUrlParams(url: string, params: string | string[]): string {
  try {
    const urlObj = new URL(url)
    const searchParams = new URLSearchParams(urlObj.search)

    const paramList = Array.isArray(params) ? params : [params]

    for (const param of paramList) {
      searchParams.delete(param)
    }

    urlObj.search = searchParams.toString()
    return urlObj.toString()
  } catch (error) {
    return url
  }
}
