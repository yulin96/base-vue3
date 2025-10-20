import type { ConfigProviderThemeVars } from 'vant'

// Blob 转换操作的缓存
const blobToBase64Cache = new WeakMap<Blob, string>()

/**
 * 将URL转换为Blob对象
 * @param url - 要转换的URL
 * @returns Promise，解析为一个Blob对象
 */
export async function urlToBlob(url: string): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('无法创建Canvas 2D上下文'))
        return
      }

      context.drawImage(image, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('无法生成Blob对象'))
      }, 'image/png')
    }

    image.onerror = () => reject(new Error(`图像加载失败: ${url}`))
    image.src = url
  })
}

/**
 * 改变图像大小
 * @param originBlob 原始图像的 Blob 对象
 * @param width 图像的宽度，默认为 600
 * @param height 图像的高度，默认为 800
 * @returns Promise，解析为调整大小后的 Blob 对象
 */
export async function changeImageSize(originBlob: Blob, width = 600, height = 800): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('您的浏览器不支持Canvas API'))
      return
    }

    // 创建图像对象
    const img = new Image()
    const blobUrl = URL.createObjectURL(originBlob)

    img.onload = () => {
      try {
        // 设置 canvas 尺寸
        canvas.width = width
        canvas.height = height

        // 在 canvas 上绘制调整大小后的图像
        ctx.drawImage(img, 0, 0, width, height)

        // 将 canvas 内容转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('转换为Blob对象失败'))
              return
            }
            resolve(blob)
          },
          'image/jpeg',
          1,
        )
      } catch (error) {
        reject(error)
      } finally {
        // 释放 Blob URL 以避免内存泄漏
        URL.revokeObjectURL(blobUrl)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('图像加载失败'))
    }

    img.src = blobUrl
  })
}

/**
 * 将 Blob 对象转换为 Base64 字符串
 * @param blob 要转换的 Blob 对象
 * @returns Promise，解析为 Base64 字符串
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  // 检查缓存
  const cached = blobToBase64Cache.get(blob)
  if (cached) {
    return cached
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // 缓存结果
        blobToBase64Cache.set(blob, reader.result)
        resolve(reader.result)
      } else {
        reject(new Error('FileReader结果不是字符串'))
      }
    }

    reader.onerror = () => reject(new Error('读取Blob失败'))
    reader.readAsDataURL(blob)
  })
}

/**
 * 将 Blob 对象转换为 File 对象
 * @param blob 要转换的 Blob 对象
 * @param fileName 转换后的 File 对象的文件名
 * @returns 转换后的 File 对象
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type })
}

/**
 * 将 base64 字符串转换为 Blob 对象
 * @param urlData base64 字符串
 * @returns Blob 对象
 */
export function base64ToBlob(urlData: string): Blob {
  // 验证输入是否为合法的 base64 数据 URL
  if (!urlData.includes('base64')) {
    throw new Error('输入必须是有效的 base64 数据 URL')
  }

  // 分割头部信息和数据部分
  const parts = urlData.split(';base64,')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('输入格式无效')
  }

  // 提取 MIME 类型
  const headerParts = parts[0].split(':')
  const mime = headerParts[1] || 'application/octet-stream'

  // 解码 base64 数据
  const base64 = parts[1]
  const byteString = atob(base64)

  // 创建 ArrayBuffer 和 Uint8Array
  const buffer = new Uint8Array(byteString.length)

  // 填充 Uint8Array
  for (let i = 0; i < byteString.length; i++) {
    buffer[i] = byteString.charCodeAt(i)
  }

  // 创建 Blob 对象
  return new Blob([buffer], { type: mime })
}

/**
 * 将 base64 数据转换为 File 对象
 * @param urlData base64 数据
 * @param fileName 文件名
 * @returns 转换后的 File 对象
 */
export function base64ToFile(urlData: string, fileName: string): File {
  const blob = base64ToBlob(urlData)
  return new File([blob], fileName, { type: blob.type })
}

/**
 * 深度转换对象的属性名
 * @param obj 要转换的对象
 * @param nameKey 包含属性名映射关系的对象
 * @param maxDepth 最大递归深度，防止循环引用导致的栈溢出
 * @returns 转换后的新对象
 */
export function convertObjectName<T = Record<string, any>>(
  obj: Record<string, any>,
  nameKey: Record<string, string>,
  maxDepth = 10,
): T {
  if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
    return obj as unknown as T
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (item === null || typeof item !== 'object') return item
      return convertObjectName(item, nameKey, maxDepth - 1)
    }) as unknown as T
  }

  const result: Record<string, any> = {}
  const keys = Object.keys(nameKey)

  for (const [key, value] of Object.entries(obj)) {
    // 跳过空值
    if (value === undefined || value === null) continue

    const newKey = keys.includes(key) ? nameKey[key] : key
    if (newKey === undefined || newKey === null) continue

    // 递归处理嵌套对象
    if (value !== null && typeof value === 'object') {
      result[newKey] = convertObjectName(value, nameKey, maxDepth - 1)
    } else {
      result[newKey] = value
    }
  }

  return result as unknown as T
}

/**
 * 将 FormData 转换为对象
 * @param formData 要转换的 FormData 对象
 * @returns 转换后的对象
 */
export function formDataToObj(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData)
}

/**
 * 将字符串中的中文部分用 <b> 标签包裹起来
 * @param str 要处理的字符串
 * @returns 处理后的字符串
 */
export function boldChinese(str: string): string {
  return str.replace(/([\u4e00-\u9fa5]+)/g, '<b>$1</b>')
}

/**
 * 将像素值转换为vw单位
 * @param text 要转换的像素值
 * @param screenSize 屏幕宽度，默认为750
 * @returns 转换后的vw单位值
 */
export function toVw(text: string, screenSize = 750): string {
  if (!text.endsWith('px')) return text

  const px = parseFloat(text.replace('px', ''))
  if (isNaN(px)) return text

  return `${((px / screenSize) * 100).toFixed(5).replace(/\.?0+$/, '')}vw`
}

/**
 * 将 Vant 组件库的样式单位从 px 转换为 vw
 * @param config Vant 组件库的主题配置对象
 * @param screenSize 屏幕宽度基准值，默认为 750px
 * @returns 转换后的 Vant 组件库主题配置对象
 */
export function convertConfigToPx(config?: ConfigProviderThemeVars, screenSize = 750): ConfigProviderThemeVars {
  if (!config) return {}

  const result: ConfigProviderThemeVars = {}

  for (const [key, value] of Object.entries(config)) {
    result[key] = typeof value === 'number' ? value : toVw(String(value), screenSize)
  }

  return result
}

/**
 * 将对象中的空值转换为空字符串
 * @param obj 需要转换的对象
 * @param maxDepth 最大递归深度，防止循环引用导致的栈溢出
 */
export function convertNullToEmpty<T>(obj: T, maxDepth = 10): T {
  if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertNullToEmpty(item, maxDepth - 1)) as unknown as T
  }

  const result = { ...obj } as any

  for (const key in result) {
    if (result[key] === null) {
      result[key] = ''
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertNullToEmpty(result[key], maxDepth - 1)
    }
  }

  return result
}

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 * @param buffer 要转换的 ArrayBuffer
 * @returns Base64 字符串
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer)
  const chunks: string[] = []
  const chunkSize = 8192 // 使用更大的块大小以提高性能

  // 按块处理数据
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize)
    chunks.push(String.fromCharCode.apply(null, chunk as unknown as number[]))
  }

  const binary = chunks.join('')
  return btoa(binary)
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @param maxDepth 最大递归深度，防止循环引用导致的栈溢出
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T, maxDepth = 100, visited = new WeakMap()): T {
  // 处理基本类型和函数
  if (obj === null || maxDepth <= 0 || typeof obj !== 'object') {
    return obj
  }

  // 检测循环引用
  if (visited.has(obj)) {
    return visited.get(obj) as T
  }

  // 标记当前对象为已访问
  const cloned = Array.isArray(obj) ? [] : ({} as any)
  visited.set(obj, cloned)

  // 处理日期
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  // 处理正则表达式
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T
  }

  // 处理 Map
  if (obj instanceof Map) {
    const map = new Map()
    obj.forEach((value, key) => {
      map.set(deepClone(key, maxDepth - 1), deepClone(value, maxDepth - 1))
    })
    return map as unknown as T
  }

  // 处理 Set
  if (obj instanceof Set) {
    const set = new Set()
    obj.forEach((value) => {
      set.add(deepClone(value, maxDepth - 1))
    })
    return set as unknown as T
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item, maxDepth - 1)) as unknown as T
  }

  // 处理普通对象
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key], maxDepth - 1, visited)
    }
  }

  return cloned
}

/**
 * 将 ArrayBuffer 转换为 Blob 对象
 * @param buffer 要转换的 ArrayBuffer
 * @param mimeType MIME 类型，默认为 'application/octet-stream'
 * @returns Blob 对象
 */
export function arrayBufferToBlob(buffer: ArrayBuffer, mimeType = 'application/octet-stream'): Blob {
  return new Blob([buffer], { type: mimeType })
}

/**
 * 从字符串中提取数字
 * @param str 包含数字的字符串
 * @param returnAsArray 是否以数组形式返回所有匹配的数字
 * @returns 如果 returnAsArray 为 true，则返回匹配的所有数字组成的数组；否则返回第一个匹配的数字或 null
 */
export function extractNumbers(str: string, returnAsArray = false): number[] | number | null {
  const matches = str.match(/-?\d+(\.\d+)?/g)

  if (!matches) {
    return returnAsArray ? [] : null
  }

  const numbers = matches.map(Number)
  return returnAsArray ? numbers : (numbers[0] ?? null)
}

/**
 * 将数字转换为指定小数位数的固定小数
 * @param num 要转换的数字
 * @param digits 小数位数，默认为 2
 * @returns 转换后的数字
 */
export function toFixedNumber(num: number, digits: number = 2): number {
  const n = typeof num === 'number' ? num : Number(num)

  if (isNaN(n)) return num

  return Number(n.toFixed(digits))
}

/**
 * 将手机号码进行脱敏处理，只显示前三位和后四位，中间用星号代替
 * @param phone 需要脱敏的手机号码
 * @returns 脱敏后的手机号码
 */
export function maskPhone(phone: string): string {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    console.warn('非标准手机号格式:', phone)
  }

  return phone.replace(/(\d{3})(\d+)(\d{4})/, '$1****$3')
}

/**
 * 去除字符串中的所有空格
 * @param str 要处理的字符串
 * @returns 处理后的字符串
 */
export function trimAll(str: string): string {
  return str.replace(/\s+/g, '')
}
