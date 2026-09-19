import { apiRecordStats } from '@/api/stats'
import { appStorageName } from '@/config/env'
import { createInteractionStatsStorage, statsTotals } from '@/utils/interactionStatsStorage'

const storage = () => createInteractionStatsStorage(appStorageName, localStorage)

export function recordInteractionStat(event: string) {
  let localError: Error | null = null
  try {
    storage().record(event)
    window.dispatchEvent(new Event('interaction-stats-change'))
  } catch (error) {
    localError = error instanceof Error ? error : new Error('本地统计保存失败')
  }
  // 云端独立尝试；调用方无需等待即可继续互动，但可检查两个通道的结果。
  return { localError, remote: apiRecordStats(event) }
}

export function getLocalInteractionStats() {
  const { daily, archives } = storage().read()
  const totals = statsTotals(daily)
  const emptyCounts = Object.fromEntries(Object.keys(totals).map(event => [event, 0]))
  return { daily: daily.map(day => ({ ...day, counts: { ...emptyCounts, ...day.counts } })), totals, archives }
}

export function archiveAndClearLocalInteractionStats() {
  const archive = storage().archiveAndClear()
  window.dispatchEvent(new Event('interaction-stats-change'))
  return archive
}
