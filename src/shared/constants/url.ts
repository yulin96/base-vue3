/**
 * 解析URL查询字符串为对象
 * @param queryString 查询字符串，可以包含前导?
 * @returns 解析后的对象
 */
export function queryStringToObject(queryString: string): Record<string, string> {
  if (!queryString) return {}

  const normalizedQuery = queryString.startsWith('?') ? queryString.substring(1) : queryString

  const result: Record<string, string> = {}

  for (const pair of normalizedQuery.split('&')) {
    const [key, value] = pair.split('=')
    if (key) {
      result[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  }

  return result
}
