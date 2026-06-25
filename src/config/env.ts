/**
 * 当前应用是否为生产模式
 */
export const prodModel = import.meta.env.PROD

/**
 * 当前应用是否为开发模式
 */
export const devModel = import.meta.env.DEV

/**
 * 当前应用是否为测试模式
 */
export const isTestURL = location.href.includes('__test__')

/**
 * 获取 Electron API 对象
 */
export const electronApi = window.api
