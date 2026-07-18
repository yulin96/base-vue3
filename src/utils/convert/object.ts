export function convertObjectName<T = Record<string, unknown>>(
  obj: Record<string, unknown>,
  nameKey: Record<string, string>,
  maxDepth = 10,
): T {
  if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
    return obj as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (item === null || typeof item !== 'object') return item
      return convertObjectName(item, nameKey, maxDepth - 1)
    }) as unknown as T
  }

  const result: Record<string, unknown> = {}
  const keys = Object.keys(nameKey)

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue

    const newKey = keys.includes(key) ? nameKey[key] : key
    if (newKey === undefined || newKey === null) continue

    result[newKey] =
      value !== null && typeof value === 'object'
        ? convertObjectName(value as Record<string, unknown>, nameKey, maxDepth - 1)
        : value
  }

  return result as unknown as T
}

export function convertNullToEmpty<T>(obj: T, maxDepth = 10): T {
  if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertNullToEmpty(item, maxDepth - 1)) as unknown as T
  }

  const result = { ...obj } as Record<string, unknown>

  for (const key in result) {
    if (result[key] === null) {
      result[key] = ''
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertNullToEmpty(result[key], maxDepth - 1)
    }
  }

  return result as T
}

export function deepClone<T>(obj: T, maxDepth = 100, visited = new WeakMap<object, unknown>()): T {
  if (obj === null || maxDepth <= 0 || typeof obj !== 'object') {
    return obj
  }

  if (visited.has(obj)) {
    return visited.get(obj) as T
  }

  if (obj instanceof Date) {
    const cloned = new Date(obj.getTime()) as unknown as T
    visited.set(obj, cloned)
    return cloned
  }

  if (obj instanceof RegExp) {
    const cloned = new RegExp(obj.source, obj.flags) as unknown as T
    visited.set(obj, cloned)
    return cloned
  }

  if (obj instanceof Map) {
    const map = new Map<unknown, unknown>()
    visited.set(obj, map)
    obj.forEach((value, key) => {
      map.set(deepClone(key, maxDepth - 1, visited), deepClone(value, maxDepth - 1, visited))
    })
    return map as unknown as T
  }

  if (obj instanceof Set) {
    const set = new Set<unknown>()
    visited.set(obj, set)
    obj.forEach((value) => {
      set.add(deepClone(value, maxDepth - 1, visited))
    })
    return set as unknown as T
  }

  if (Array.isArray(obj)) {
    const cloned: unknown[] = []
    visited.set(obj, cloned)
    for (let i = 0; i < obj.length; i++) {
      cloned[i] = deepClone(obj[i], maxDepth - 1, visited)
    }
    return cloned as T
  }

  const source = obj as Record<string, unknown>
  const cloned: Record<string, unknown> = {}
  visited.set(obj, cloned)

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(source[key], maxDepth - 1, visited)
    }
  }

  return cloned as T
}
