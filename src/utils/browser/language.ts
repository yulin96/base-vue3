/**
 * 获取用户的浏览器语言设置
 * @returns 用户的浏览器语言设置
 */
export function getUserLanguage(): string {
  return navigator?.language || (Array.isArray(navigator?.languages) && navigator?.languages?.[0]) || 'zh-CN'
}

/**
 * 检查用户语言是否为中文
 * @returns 如果用户语言为中文则返回true，否则返回false
 */
export function isChineseLanguage(): boolean {
  return getUserLanguage().startsWith('zh')
}

/**
 * 检查用户语言是否为简体中文
 * @returns 如果用户语言为简体中文则返回true，否则返回false
 */
export function isSimplifiedChinese(): boolean {
  return getUserLanguage() === 'zh-CN' || getUserLanguage() === 'zh-Hans'
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
  return getUserLanguage().startsWith('en')
}
