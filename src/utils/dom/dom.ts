const scriptLoadTasks = new Map<string, Promise<void>>()
const stylesheetLoadTasks = new Map<string, Promise<void>>()

/**
 * 检测页面上的元素
 * 通过在屏幕上均匀分布的点来检测元素，用于获取页面主要内容
 * @param num - 检测点的数量，默认为 10
 * @returns 检测到的元素集合
 */
export function detectionElements(num = 10): Set<Element> {
  if (!Number.isInteger(num) || num <= 0) {
    throw new RangeError('num 必须是正整数')
  }

  if (num === 1) {
    const centerElement = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    return centerElement ? new Set([centerElement]) : new Set()
  }

  const calcWidth = [10, (innerWidth - 20) / (num - 1)]
  const calcHeight = [10, (innerHeight - 20) / (num - 1)]

  const doms = new Set<Element>()

  for (let i = 0; i < num; i++) {
    const x = (calcWidth[0] ?? 0) + (calcWidth[1] ?? 0) * i
    const y = (calcHeight[0] ?? 0) + (calcHeight[1] ?? 0) * i
    const reciprocalY = (calcHeight[0] ?? 0) + (calcHeight[1] ?? 0) * (num - i - 1)

    // 获取直线上和对角线上的元素
    const element1 = document.elementFromPoint(x, y)
    const element2 = document.elementFromPoint(x, reciprocalY)

    if (element1) doms.add(element1)
    if (element2) doms.add(element2)
  }

  return doms
}

/**
 * 检测浏览器是否支持指定的 CSS 特性
 * @param propertyName - CSS 属性名
 * @returns 如果支持则返回 true，否则返回 false
 */
export function supportsCSSProperty(propertyName: string): boolean {
  return propertyName in document.documentElement.style
}

/**
 * 异步加载脚本
 * @param url - 脚本URL
 * @param options - 加载选项
 * @returns Promise 对象，解析为 void
 */
export function loadScript(url: string, options: { async?: boolean; defer?: boolean } = {}): Promise<void> {
  const normalizedUrl = new URL(url, document.baseURI).href
  const existingTask = scriptLoadTasks.get(normalizedUrl)
  if (existingTask) return existingTask

  const { async = true, defer = false } = options

  const task = new Promise<void>((resolve, reject) => {
    if ([...document.scripts].some((script) => script.src === normalizedUrl)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.async = async
    script.defer = defer

    script.onload = () => {
      script.onload = null
      script.onerror = null
      resolve()
    }
    script.onerror = () => {
      script.onload = null
      script.onerror = null
      script.remove()
      reject(new Error(`Failed to load script: ${url}`))
    }

    document.head.appendChild(script)
  })

  scriptLoadTasks.set(normalizedUrl, task)
  void task.catch(() => scriptLoadTasks.delete(normalizedUrl))
  return task
}

/**
 * 异步加载样式表
 * @param url - 样式表URL
 * @returns Promise 对象，解析为 void
 */
export function loadStylesheet(url: string): Promise<void> {
  const normalizedUrl = new URL(url, document.baseURI).href
  const existingTask = stylesheetLoadTasks.get(normalizedUrl)
  if (existingTask) return existingTask

  const task = new Promise<void>((resolve, reject) => {
    if ([...document.styleSheets].some((stylesheet) => stylesheet.href === normalizedUrl)) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url

    link.onload = () => {
      link.onload = null
      link.onerror = null
      resolve()
    }
    link.onerror = () => {
      link.onload = null
      link.onerror = null
      link.remove()
      reject(new Error(`Failed to load stylesheet: ${url}`))
    }

    document.head.appendChild(link)
  })

  stylesheetLoadTasks.set(normalizedUrl, task)
  void task.catch(() => stylesheetLoadTasks.delete(normalizedUrl))
  return task
}

/**
 * 检查元素是否在视口中可见
 * @param element - 目标元素
 * @param options - 配置选项
 * @returns 如果元素在视口中可见则返回 true，否则返回 false
 */
export function isElementInViewport(element: Element, options: { threshold?: number } = {}): boolean {
  const { threshold = 0 } = options
  const rect = element.getBoundingClientRect()

  return (
    rect.top + threshold < window.innerHeight &&
    rect.bottom - threshold > 0 &&
    rect.left + threshold < window.innerWidth &&
    rect.right - threshold > 0
  )
}

/**
 * 创建一个元素可见性观察器
 * @param element - 要观察的元素
 * @param callback - 元素可见性变化时的回调函数
 * @param options - Intersection Observer 选项
 * @returns 用于停止观察的函数
 */
export function observeElementVisibility(
  element: Element,
  callback: (isVisible: boolean, entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = { threshold: 0 },
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      callback(entry.isIntersecting, entry)
    })
  }, options)

  observer.observe(element)
  return () => observer.disconnect()
}

/**
 * 获取元素的计算样式值
 * @param element - 目标元素
 * @param property - CSS 属性名
 * @returns CSS 属性值
 */
export function getComputedStyle(element: Element, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property)
}

/**
 * 判断两个元素是否重叠，可设置间距
 * @param el1 - 第一个元素
 * @param el2 - 第二个元素
 * @param gap - 允许的间距（像素），默认为 0，gap > 0 时即使间隔 gap 以内也算重叠
 * @returns 如果重叠或间距小于等于 gap 返回 true，否则返回 false
 */
export function isElementsOverlap(el1: Element, el2: Element, gap = 0): boolean {
  const r1 = el1.getBoundingClientRect()
  const r2 = el2.getBoundingClientRect()
  return !(r1.right + gap < r2.left || r1.left - gap > r2.right || r1.bottom + gap < r2.top || r1.top - gap > r2.bottom)
}
