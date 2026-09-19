export type StatsDay = { date: string; counts: Record<string, number> }
export type StatsArchive = {
  id: string
  scope: string
  archivedAt: string
  startDate: string | null
  endDate: string | null
  daily: StatsDay[]
  totals: Record<string, number>
}
type StatsState = { version: 1; daily: StatsDay[]; archives: StatsArchive[] }

export function statsDate(now: Date) {
  return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10)
}

export function statsTotals(daily: StatsDay[]) {
  const counts = new Map<string, number>()
  for (const day of daily) {
    for (const [event, count] of Object.entries(day.counts)) counts.set(event, (counts.get(event) || 0) + count)
  }
  return Object.fromEntries(counts)
}

export function createInteractionStatsStorage(scope: string, storage: Pick<Storage, 'getItem' | 'setItem'>) {
  if (!scope.trim()) throw new Error('请设置当前项目的本地统计标识')
  const key = `interaction-stats:${scope}:v1`
  const read = (): StatsState => {
    const text = storage.getItem(key)
    if (text === null) return { version: 1, daily: [], archives: [] }
    const state = JSON.parse(text) as StatsState
    if (state.version !== 1 || !Array.isArray(state.daily) || !Array.isArray(state.archives)) {
      throw new Error('本地统计格式不正确，请先备份数据后检查')
    }
    return state
  }
  const save = (state: StatsState) => storage.setItem(key, JSON.stringify(state))

  return {
    read,
    record(event: string, now = new Date()) {
      const label = event.trim()
      if (!label || Array.from(label).length > 64) throw new Error('统计事件名称需为 1–64 个字符')
      const state = read()
      const date = statsDate(now)
      let day = state.daily.find(item => item.date === date)
      if (!day) { day = { date, counts: {} }; state.daily.push(day) }
      const counts = new Map(Object.entries(day.counts))
      counts.set(label, (counts.get(label) || 0) + 1)
      day.counts = Object.fromEntries(counts)
      state.daily.sort((a, b) => b.date.localeCompare(a.date))
      save(state)
      return { daily: state.daily, totals: statsTotals(state.daily) }
    },
    archiveAndClear(now = new Date()) {
      const state = read()
      const dates = state.daily.map(day => day.date).sort()
      const archive: StatsArchive = {
        id: `${now.getTime()}-${Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-')}`,
        scope,
        archivedAt: now.toISOString(),
        startDate: dates[0] ?? null,
        endDate: dates[dates.length - 1] ?? null,
        daily: state.daily,
        totals: statsTotals(state.daily),
      }
      // 归档与清空一次持久化；写入失败不会覆盖原数据。
      save({ version: 1, daily: [], archives: [...state.archives, archive] })
      return archive
    },
  }
}
