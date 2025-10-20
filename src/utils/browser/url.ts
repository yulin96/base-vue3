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
