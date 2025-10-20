/**
 * 计算两个日期之间的天数差异
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 两个日期之间的天数差异
 */
export function dayDiff(date1: Date, date2: Date): number {
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
    throw new Error('参数必须是 Date 类型')
  }

  // 将两个日期都设置为当天的00:00:00以计算天数差
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())

  // 一天的毫秒数
  const ONE_DAY = 1000 * 60 * 60 * 24

  // 计算相差的天数（使用Math.round避免夏令时导致的误差）
  return Math.round(Math.abs((d1.getTime() - d2.getTime()) / ONE_DAY))
}

/**
 * 计算给定日期是一年中的第几天
 * @param date 要计算的日期，默认为今天
 * @returns 给定日期是一年中的第几天
 */
export function dayOfYear(date = new Date()): number {
  if (!(date instanceof Date)) {
    throw new Error('参数必须是 Date 类型')
  }

  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}
