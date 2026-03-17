import { debounce } from 'es-toolkit'

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
 * 延迟指定的时间
 * @param time 延迟的时间（以毫秒为单位）
 * @returns 一个 Promise，在指定的时间后解析
 */
export function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, time)
  })
}
