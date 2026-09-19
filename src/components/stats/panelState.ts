import { statsTotals, type StatsDay } from '../../utils/interactionStatsStorage.ts'

export function panelData(daily: StatsDay[]) {
  const totals = statsTotals(daily)
  const events = Object.keys(totals)
  return {
    totals, events,
    daily: [...daily].sort((a, b) => b.date.localeCompare(a.date)).map(day => ({
      date: day.date,
      counts: Object.fromEntries(events.map(event => [event, Object.hasOwn(day.counts, event) ? day.counts[event] : 0])),
    })),
  }
}

export function bindStatsShortcut(win: EventTarget, doc: EventTarget, toggle: () => void, hide: () => void) {
  const down = (event: Event) => {
    const key = event as KeyboardEvent
    const target = key.target as HTMLElement | null
    const editable = target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
    if (key.key.toLowerCase() === 'p' && !key.repeat && !key.isComposing && !key.ctrlKey && !key.metaKey && !key.altKey && !editable) toggle()
  }
  win.addEventListener('keydown', down)
  win.addEventListener('blur', hide)
  doc.addEventListener('visibilitychange', hide)
  return () => {
    win.removeEventListener('keydown', down)
    win.removeEventListener('blur', hide)
    doc.removeEventListener('visibilitychange', hide)
  }
}
