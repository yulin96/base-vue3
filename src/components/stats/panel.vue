<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { statsDate, type StatsDay, type StatsArchive } from '../../utils/interactionStatsStorage'
import { bindStatsShortcut, panelData } from './panelState'

const props = withDefaults(defineProps<{
  modelValue?: boolean
  title?: string
  source?: {
    read: () => { daily: StatsDay[]; archives: StatsArchive[] }
    archiveAndClear: () => unknown
  }
}>(), { modelValue: false, title: '本机统计', source: undefined })
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const opened = ref(false)
const state = ref({ daily: [] as StatsDay[], archives: [] as StatsArchive[] })
const error = ref('')
const today = ref(statsDate(new Date()))
const data = computed(() => panelData(state.value.daily))
const todayCounts = computed(() => data.value.daily.find(day => day.date === today.value)?.counts ?? {})
let revision = 0
async function refresh() {
  today.value = statsDate(new Date())
  const current = ++revision
  try {
    const value = props.source ? props.source.read() : (await import('../../utils/interactionStats')).getLocalInteractionStats()
    if (current !== revision) return
    state.value = value; error.value = ''
  } catch {
    if (current !== revision) return
    state.value = { daily: [], archives: [] }
    error.value = '暂时无法读取本机统计，请检查浏览器存储权限或备份后检查数据。'
  }
}
function show() { opened.value = true; emit('update:modelValue', true); void refresh() }
function toggle() { opened.value ? hide() : show() }
function hide() { opened.value = false; emit('update:modelValue', false) }
async function clear() {
  try {
    if (props.source) props.source.archiveAndClear()
    else (await import('../../utils/interactionStats')).archiveAndClearLocalInteractionStats()
    await refresh()
  } catch { error.value = '暂时未能归档，原统计已保留，请检查存储空间后重试。' }
}
function updated() { if (opened.value) void refresh() }
watch(() => props.modelValue, value => { if (value !== opened.value) value ? show() : hide() }, { immediate: true })
watch(() => props.source, updated)
let unbind: (() => void) | undefined
onMounted(() => {
  unbind = bindStatsShortcut(window, document, toggle, hide)
  window.addEventListener('storage', updated)
  window.addEventListener('interaction-stats-change', updated)
})
onUnmounted(() => {
  revision++
  unbind?.()
  window.removeEventListener('storage', updated)
  window.removeEventListener('interaction-stats-change', updated)
})
const number = (value: number) => value.toLocaleString('zh-CN')
</script>

<template>
  <Teleport to="body">
    <section v-if="opened" class="stats-panel" role="region" :aria-label="title" tabindex="-1" @keydown.esc="hide">
      <header class="stats-panel-heading">
        <time :datetime="today">{{ today }}</time>
        <button btn type="button" :disabled="!state.daily.length || !!error" @click="clear">清除全部</button>
      </header>
      <p v-if="error" role="alert" class="stats-panel-error">{{ error }}</p>
      <div class="stats-panel-content" tabindex="0" role="region" aria-label="统计明细，可滚动">
        <p v-if="!data.events.length && !error" class="stats-panel-empty">暂无记录</p>
        <template v-if="data.events.length">
          <section class="stats-panel-section" aria-label="今日数据">
            <h3>今日数据</h3>
            <div class="stats-panel-cards">
              <div v-for="event in data.events" :key="event" class="stats-panel-card">
                <p>{{ event }}</p>
                <strong>{{ number(Object.hasOwn(todayCounts, event) ? todayCounts[event]! : 0) }}</strong>
              </div>
            </div>
          </section>
          <section class="stats-panel-section" aria-label="累计数据">
            <h3>累计数据</h3>
            <div class="stats-panel-cards">
              <div v-for="event in data.events" :key="event" class="stats-panel-card">
                <p>{{ event }}</p>
                <strong>{{ number(data.totals[event] ?? 0) }}</strong>
              </div>
            </div>
          </section>
          <section class="stats-panel-section" aria-label="历史数据">
            <h3>历史数据</h3>
            <div class="stats-panel-table" tabindex="0" role="region" aria-label="每日各项统计，可横向滚动">
              <table>
                <thead><tr><th scope="col">日期</th><th v-for="event in data.events" :key="event" scope="col">{{ event }}</th></tr></thead>
                <tbody>
                  <tr v-for="day in data.daily" :key="day.date">
                    <th scope="row">{{ day.date }}</th>
                    <td v-for="event in data.events" :key="event">{{ number(day.counts[event] ?? 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </div>
    </section>
  </Teleport>
</template>

<style scoped>
.stats-panel { position: fixed; top: .75em; left: .75em; z-index: 10000; box-sizing: border-box; display: flex; flex-direction: column; width: 44em; max-width: calc(100vw - 1.5em); max-height: calc(100vh - 1.5em); padding: 1.5em; border: 1px solid #414245; border-radius: 1.1em; background: rgb(30 31 33 / 97%); color: #f3f3f4; font-size: var(--interaction-stats-font-size, 3rem); font-weight: 400; line-height: 1.5; font-variant-numeric: tabular-nums; }
.stats-panel-heading { display: flex; flex: none; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .65em; margin-bottom: 1.4em; }
.stats-panel-heading time { font-size: 1.8em; font-weight: 650; line-height: 1.2; overflow-wrap: anywhere; }
.stats-panel button { font: inherit; font-size: .9em; line-height: 1.4; color: #d0d1d4; border: 1px solid #484a4e; background: #292a2d; padding: .5em .8em; border-radius: .65em; cursor: pointer; }
.stats-panel button:disabled { opacity: .45; cursor: default; }
.stats-panel-content { min-height: 0; overflow: auto; overscroll-behavior: contain; }
.stats-panel h3 { margin: 0 0 .8em; font-size: 1.15em; font-weight: 600; }
.stats-panel-section + .stats-panel-section { margin-top: 1.4em; padding-top: 1.3em; border-top: 1px solid #424447; }
.stats-panel-cards { display: flex; flex-wrap: wrap; gap: .7em; }
.stats-panel-card { box-sizing: border-box; flex: 1 1 calc((100% - 1.4em) / 3); min-width: min(100%, 8em); padding: .9em 1em; border: 1px solid #3b3d41; border-radius: .75em; background: #292b2e; }
.stats-panel-card p { margin: 0 0 .3em; color: #b9bbc0; overflow-wrap: anywhere; }
.stats-panel-card strong { display: block; font-size: 1.65em; font-weight: 650; line-height: 1.25; overflow-wrap: anywhere; }
.stats-panel-table { max-width: 100%; overflow-x: auto; border: 1px solid #414347; border-radius: .75em; }
.stats-panel table { width: 100%; border-collapse: collapse; font-size: .95em; }
.stats-panel th, .stats-panel td { padding: .7em .85em; text-align: right; border-bottom: 1px solid #414347; }
.stats-panel thead th { color: #b9bbc0; font-weight: 400; background: #2b2d30; min-width: 3em; max-width: 12em; overflow-wrap: anywhere; }
.stats-panel tbody th { text-align: left; font-weight: 400; white-space: nowrap; }
.stats-panel thead th:first-child { text-align: left; }
.stats-panel tbody tr:first-child { background: #35373a; }
.stats-panel tbody tr:last-child > * { border-bottom: 0; }
.stats-panel td { white-space: nowrap; }
.stats-panel-empty { margin: 0; padding: 1em 0; color: #b9bbc0; }
.stats-panel-error { margin: 0 0 1em; overflow-wrap: anywhere; }
.stats-panel :focus-visible { outline: 1px solid #9fc1ff; outline-offset: -2px; }
@media (max-width: 700px) {
  .stats-panel { font-size: var(--interaction-stats-font-size, 2.4rem); padding: 1em; }
  .stats-panel-heading { margin-bottom: 1em; }
  .stats-panel-heading time { font-size: 1.5em; }
  .stats-panel h3 { margin-bottom: .6em; font-size: 1.1em; }
  .stats-panel-section + .stats-panel-section { margin-top: 1em; padding-top: 1em; }
  .stats-panel-cards { gap: .5em; }
  .stats-panel-card { flex-basis: calc((100% - 1em) / 3); padding: .65em .75em; }
  .stats-panel-card strong { font-size: 1.4em; }
  .stats-panel table, .stats-panel button { font-size: 1em; }
  .stats-panel th, .stats-panel td { padding: .6em; }
}
</style>
