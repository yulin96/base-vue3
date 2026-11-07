<script setup lang="ts">
import { computed, nextTick, onUnmounted, reactive, ref } from 'vue'
import { useStorage, useTitle } from '@vueuse/core'
import {
  LucideArrowRight as ArrowRight,
  LucideCheck as Check,
  LucideClock3 as Clock3,
  LucideGift as Gift,
  LucideHeadphones as Headphones,
  LucideSparkles as Sparkles,
  LucideStar as Star,
  LucideTicket as Ticket,
  LucideScanLine as ScanLine,
} from '@lucide/vue'
import { nanoid } from 'nanoid'
import { useQRCode } from '@/hooks/ui/useQRCode'
import { useGsapContext } from '@/hooks/animation/useGsapContext'
import { focusDom } from '@/utils/dom/focus'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

type Question = { title: string; type: 'single' | 'multiple' | 'rating' | 'text'; options?: string[]; hint?: string }
const questions: Question[] = [
  {
    title: '这是你第几次参加我们的活动？',
    type: 'single',
    options: ['第一次', '第二次', '三次及以上'],
  },
  {
    title: '你是通过什么渠道了解到本次活动的？',
    type: 'single',
    options: ['微信 / 公众号', '朋友推荐', '小红书 / 社交平台', '线下海报', '其他渠道'],
  },
  { title: '你今天是和谁一起来的？', type: 'single', options: ['独自参加', '朋友 / 同事', '伴侣 / 家人'] },
  {
    title: '哪些内容最吸引你参加？',
    type: 'multiple',
    hint: '可多选',
    options: ['主题内容', '嘉宾分享', '互动体验', '认识新朋友', '活动福利'],
  },
  { title: '你对活动前的信息指引满意吗？', type: 'rating' },
  {
    title: '现场签到体验如何？',
    type: 'single',
    options: ['顺畅', '一般', '需要改进'],
  },
  { title: '你对现场环境和布置满意吗？', type: 'rating' },
  {
    title: '你最喜欢哪些现场环节？',
    type: 'multiple',
    hint: '可多选',
    options: ['主题分享', '体验互动', '展览打卡', '自由交流', '惊喜福利'],
  },
  {
    title: '活动内容符合你的预期吗？',
    type: 'single',
    options: ['超出预期', '符合预期', '部分符合', '与预期有差距'],
  },
  { title: '你对工作人员的服务满意吗？', type: 'rating' },
  { title: '整体来说，你会给本次活动打几分？', type: 'rating' },
  { title: '你愿意向朋友推荐我们的活动吗？', type: 'single', options: ['非常愿意', '可能会', '还不确定', '暂时不会'] },
  {
    title: '下次活动，你更期待哪些内容？',
    type: 'multiple',
    hint: '可多选',
    options: ['更多实用分享', '更多动手体验', '更深入的交流', '更多展览内容', '更多惊喜福利'],
  },
  {
    title: '未来你希望怎样收到活动消息？',
    type: 'single',
    options: ['微信公众号', '社群通知', '社交平台', '自行关注'],
  },
  { title: '你对本次活动还有哪些建议？', type: 'text' },
]
const prizes = [
  { name: '无线蓝牙耳机', icon: Headphones },
  { name: '随行保温杯', icon: Gift },
  { name: '咖啡兑换券', icon: Ticket },
  { name: '谢谢参与', icon: Sparkles },
]
const saved = useStorage('youli:event-survey:v1', {
  answers: {} as Record<string, string | string[] | number>,
  submitted: false,
  prizeIndex: -1,
  claimCode: '',
})
if (saved.value.prizeIndex >= 0 && saved.value.prizeIndex !== 3 && !saved.value.claimCode) {
  saved.value.claimCode = nanoid(16)
}
const page = ref<'survey' | 'lottery' | 'redemption'>(
  saved.value.prizeIndex >= 0 ? 'redemption' : saved.value.submitted ? 'lottery' : 'survey',
)
const scrollBox = ref<HTMLElement>()
const ui = reactive({ error: -1, spinning: false, activeCell: -1 })
const answered = computed(() => questions.filter((_, i) => isAnswered(i)).length)
const result = computed(() => prizes[saved.value.prizeIndex])
const hasPrize = computed(() => !!result.value && saved.value.prizeIndex !== 3)
const redemptionQRCode = useQRCode(
  () =>
    hasPrize.value && saved.value.claimCode
      ? JSON.stringify({ type: 'prize-redemption', code: saved.value.claimCode })
      : '',
  { width: 720, margin: 4, color: { dark: '#23271f', light: '#ffffff' } },
)
const lotteryCells = [0, 1, 2, 2, -1, 0, 1, 3, 2]
const ring = [0, 1, 2, 5, 8, 7, 6, 3]
let spinTimer: ReturnType<typeof setTimeout> | undefined
useTitle(() =>
  page.value === 'survey'
    ? '现场体验问卷'
    : page.value === 'lottery'
      ? '幸运抽奖'
      : hasPrize.value
        ? '奖品核销'
        : '抽奖结果',
)
useGsapContext('.index', () => {})

function isAnswered(index: number) {
  const value = saved.value.answers[index]
  if (Array.isArray(value)) return value.length > 0
  return typeof value === 'number' ? value >= 1 && value <= 5 : typeof value === 'string' && value.trim().length > 0
}
function moveTo(next: typeof page.value) {
  page.value = next
  ui.error = -1
  nextTick(() => scrollBox.value?.scrollTo({ top: 0 }))
}
function select(index: number, option: string | number, multiple = false) {
  ui.error = -1
  if (multiple) {
    const value = saved.value.answers[index]
    const current = Array.isArray(value) ? value : []
    saved.value.answers[index] = current.includes(String(option))
      ? current.filter((v) => v !== option)
      : [...current, String(option)]
  } else saved.value.answers[index] = option
}
function isSelected(index: number, option: string) {
  const value = saved.value.answers[index]
  return Array.isArray(value) ? value.includes(option) : value === option
}
async function submitSurvey() {
  if (saved.value.submitted) return
  const missing = questions.findIndex((_, index) => !isAnswered(index))
  if (missing >= 0) {
    ui.error = missing
    await nextTick()
    focusDom(`question-${missing}`)
    scrollBox.value?.querySelector<HTMLElement>(`[question-${missing}] textarea`)?.focus()
    return
  }
  saved.value.submitted = true
  moveTo('lottery')
}
function draw() {
  if (!saved.value.submitted || saved.value.prizeIndex >= 0 || ui.spinning) return
  ui.spinning = true
  let step = 0
  const prizeIndex = Math.floor(Math.random() * prizes.length)
  const target = ring.findIndex((cell) => lotteryCells[cell] === prizeIndex)
  const total = 24 + target
  function tick() {
    ui.activeCell = ring[step % ring.length]!
    if (step >= total) {
      if (prizeIndex !== 3) saved.value.claimCode = nanoid(16)
      saved.value.prizeIndex = prizeIndex
      ui.spinning = false
      moveTo('redemption')
      return
    }
    step++
    spinTimer = setTimeout(tick, step > total - 7 ? 100 + (step - total + 7) * 35 : 65)
  }
  tick()
}
onUnmounted(() => {
  clearTimeout(spinTimer)
})
</script>

<template>
  <div class="size-full">
    <section ref="scrollBox" class="scroll-box index">
      <main class="content survey-content">
        <template v-if="page === 'survey'">
          <div class="px-40 pt-55">
            <h1 class="text-45 font-semibold">现场体验问卷</h1>
            <div class="mt-22 flex items-center justify-between">
              <p class="text-24 text-[#726a5d]">完成问卷，即可参与抽奖。</p>
              <span class="text-21 flex items-center gap-7 text-[#81796b]"><Clock3 class="size-24" />约 3 分钟</span>
            </div>
          </div>
          <div class="sticky top-0 z-10 bg-[#f9f7f0] px-40 pt-28 pb-20">
            <div class="text-21 mb-13 flex items-center justify-between text-[#726a5d]">
              <span>填写进度</span
              ><span
                ><b class="text-[#b64b23]">{{ answered }}</b> / 15</span
              >
            </div>
            <div
              class="h-5 overflow-hidden rounded-full bg-[#e7e0d4]"
              role="progressbar"
              :aria-valuenow="answered"
              :aria-valuemin="0"
              :aria-valuemax="15"
              aria-label="已完成题数"
            >
              <div class="h-full rounded-full bg-[#d75b2c]" :style="{ width: `${(answered / 15) * 100}%` }"></div>
            </div>
          </div>
          <div class="px-40 pb-50">
            <div
              v-for="(question, index) in questions"
              :key="index"
              v-bind="{ [`question-${index}`]: '' }"
              class="question-block"
              :class="{ 'question-error': ui.error === index }"
            >
              <div class="flex items-start gap-16">
                <span class="text-23 pt-4 text-[#806a52]">{{ String(index + 1).padStart(2, '0') }}</span>
                <div class="min-w-0 flex-1">
                  <h2 class="text-28 leading-[1.6] font-medium">
                    {{ question.title }}<span class="ml-5 text-[#d75b2c]">*</span>
                  </h2>
                  <p v-if="question.hint" class="text-21 mt-9 leading-relaxed text-[#867c6b]">{{ question.hint }}</p>
                </div>
              </div>
              <div v-if="question.options" class="mt-22 grid gap-13" role="group" :aria-label="question.title">
                <div
                  v-for="option in question.options"
                  :key="option"
                  class="answer-option"
                  :class="{ selected: isSelected(index, option) }"
                  role="button"
                  ig
                  :aria-pressed="isSelected(index, option)"
                  @click="select(index, option, question.type === 'multiple')"
                >
                  <span class="option-check" :class="{ square: question.type === 'multiple' }"
                    ><Check v-if="isSelected(index, option)" class="size-20" /></span
                  ><span>{{ option }}</span>
                </div>
              </div>
              <div v-else-if="question.type === 'rating'" class="mt-25">
                <div class="flex justify-between gap-13">
                  <div
                    v-for="n in 5"
                    :key="n"
                    class="rating-option"
                    :class="{ selected: Number(saved.answers[index] || 0) >= n }"
                    role="button"
                    ig
                    :aria-label="`${n} 分`"
                    :aria-pressed="saved.answers[index] === n"
                    @click="select(index, n)"
                  >
                    <Star
                      class="size-35"
                      :fill="Number(saved.answers[index] || 0) >= n ? 'currentColor' : 'none'"
                      :stroke-width="1.5"
                    />
                  </div>
                </div>
                <div class="text-20 mt-15 flex justify-between text-[#756b5b]">
                  <span>不太满意</span><span>非常满意</span>
                </div>
              </div>
              <div v-else class="textarea-wrap mt-22">
                <textarea
                  v-model.trim="saved.answers[index]"
                  :aria-label="question.title"
                  class="text-25 h-170 w-full resize-none leading-relaxed"
                  placeholder="请输入你的意见或建议"
                  maxlength="300"
                  @input="ui.error = -1"
                ></textarea>
                <div class="text-19 text-right text-[#938775]">
                  {{ String(saved.answers[index] || '').length }} / 300
                </div>
              </div>
              <p v-if="ui.error === index" class="text-22 mt-15 text-[#c34624]" role="alert">
                {{ question.type === 'text' ? '请填写意见或建议' : '请回答此题' }}
              </p>
            </div>

            <div class="primary-action mt-35" role="button" btn :aria-disabled="saved.submitted" @click="submitSurvey">
              <span>提交问卷，参与抽奖</span><ArrowRight class="size-30" />
            </div>
          </div>
        </template>
        <template v-else-if="page === 'lottery'">
          <div class="px-40 pt-60 pb-50 text-center">
            <div class="text-22 inline-flex items-center gap-9 rounded-full bg-[#e9eee1] px-23 py-13 text-[#56663c]">
              <Check class="size-24" />问卷已提交
            </div>
            <h1 class="text-45 mt-30 font-semibold">幸运抽奖</h1>
            <p class="text-24 mt-16 text-[#726a5d]">{{ result ? '抽奖机会已使用' : '你有 1 次抽奖机会' }}</p>
            <div class="lottery-board mt-40">
              <div
                v-for="(prizeId, cell) in lotteryCells"
                :key="cell"
                class="lottery-cell"
                :class="{ 'draw-trigger': prizeId < 0, active: ui.activeCell === cell, 'no-prize': prizeId === 3 }"
              >
                <div
                  v-if="prizeId < 0"
                  class="flex size-full flex-col items-center justify-center gap-12"
                  role="button"
                  btn
                  :aria-disabled="ui.spinning || !!result"
                  @click="draw"
                >
                  <Gift class="size-52" :stroke-width="1.4" /><b class="text-30">{{
                    ui.spinning ? '好运转动中' : result ? '已抽奖' : '立即抽奖'
                  }}</b
                  ><span class="text-18">{{ result ? '机会已使用' : '仅限一次 · 祝你好运' }}</span>
                </div>
                <template v-else
                  ><component :is="prizes[prizeId]!.icon" class="size-49" :stroke-width="1.25" /><span
                    class="text-22 mt-19"
                    >{{ prizes[prizeId]!.name }}</span
                  ></template
                >
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="px-40 pt-70 pb-60 text-center" aria-live="polite">
            <div
              class="mx-auto flex size-110 items-center justify-center rounded-full"
              :class="hasPrize ? 'bg-[#f7e4d5] text-[#b64b23]' : 'bg-[#ece8dd] text-[#726a5d]'"
            >
              <component :is="result?.icon || Sparkles" class="size-53" :stroke-width="1.4" />
            </div>
            <h1 class="text-44 mt-28 font-semibold">{{ hasPrize ? '恭喜中奖' : '谢谢参与' }}</h1>
            <p class="text-28 mt-16" :class="hasPrize ? 'text-[#b64b23]' : 'text-[#726a5d]'">
              {{ hasPrize ? result?.name : '本次未中奖，感谢你的参与。' }}
            </p>
            <section v-if="hasPrize" class="rounded-18 mt-45 bg-white px-30 pt-35 pb-32" aria-label="奖品核销凭证">
              <div class="flex items-center justify-between">
                <h2 class="text-29 font-medium">领奖二维码</h2>
                <span class="text-21 rounded-full bg-[#e9eee1] px-19 py-9 text-[#56663c]">待核销</span>
              </div>
              <div class="mx-auto mt-22 flex size-390 items-center justify-center bg-white">
                <img
                  v-if="redemptionQRCode"
                  :src="redemptionQRCode"
                  alt="奖品核销二维码，请向工作人员出示"
                  class="size-full"
                />
                <span v-else class="text-23 text-[#726a5d]" role="status">二维码生成中…</span>
              </div>
              <p class="text-21 mt-15 text-[#726a5d]">凭证编号</p>
              <p class="text-27 tracking-2 mt-9 font-medium break-all">{{ saved.claimCode }}</p>
              <div
                class="text-23 mt-30 flex items-center justify-center gap-11 border-t border-dashed border-[#e2dcd0] pt-27 text-[#726a5d]"
              >
                <ScanLine class="size-28 shrink-0" /><span>请向现场工作人员出示此码领奖</span>
              </div>
            </section>
          </div>
        </template>
      </main>
    </section>
  </div>
</template>

<style scoped>
.index {
  background: #f9f7f0;
  color: #34382d;
  font-family:
    'PingFang SC',
    'Noto Sans SC',
    -apple-system,
    sans-serif;
}
.survey-content {
  min-height: max(1410px, 100%);
  overflow: visible;
  display: flex;
  flex-direction: column;
  background: #f9f7f0;
  white-space: normal;
  line-height: 1.5;
  word-break: normal;
}
.primary-action {
  min-height: 102px;
  padding: 24px 33px;
  background: #c04b23;
  color: #fffdf7;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 22px;
  border-radius: 13px;
  font-size: 29px;
  font-weight: 550;
  cursor: pointer;
  transition:
    background 0.18s,
    transform 0.18s;
}
.primary-action:active {
  background: #c55025;
  transform: scale(0.985);
}
.question-block {
  scroll-margin-top: 125px;
  margin-top: 35px;
  padding: 30px 0 35px;
  border-bottom: 1px solid #e8e0d3;
  border-radius: 2px;
}
.question-error {
  color: #c34624;
}
.answer-option {
  min-height: 85px;
  display: flex;
  align-items: center;
  gap: 17px;
  padding: 19px 23px;
  border: 1px solid #e2dcd0;
  border-radius: 11px;
  background: #fffdf8;
  font-size: 25px;
  color: #5e5a4f;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.answer-option.selected {
  border-color: #d75b2c;
  background: #fcf0e5;
  color: #ab4a23;
}
.option-check {
  width: 29px;
  height: 29px;
  flex: none;
  border: 1px solid #9c9180;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.selected .option-check {
  background: #d75b2c;
  border-color: #d75b2c;
  color: white;
}
.option-check.square {
  border-radius: 5px;
}
.rating-option {
  flex: 1;
  height: 87px;
  border: 1px solid #e2dcd0;
  border-radius: 12px;
  color: #97866d;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fffdf8;
}
.rating-option.selected {
  color: #d75b2c;
  background: #fcf0e5;
  border-color: #e8b797;
}
.textarea-wrap {
  padding: 22px;
  border: 1px solid #dcd4c5;
  background: #fffdf8;
  border-radius: 12px;
}
.textarea-wrap:focus-within {
  border-color: #d75b2c;
}
.textarea-wrap textarea {
  caret-color: #d75b2c;
}
.textarea-wrap ::selection {
  background: #f4d3b7;
}
.lottery-board {
  padding: 22px;
  background: #eacbad;
  border-radius: 25px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
}
.lottery-cell {
  min-height: 174px;
  padding: 20px 5px;
  background: #fffcf2;
  color: #9c572e;
  border-radius: 13px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.lottery-cell.active {
  background: #f7d27a;
  box-shadow: inset 0 0 0 4px #d95e2f;
}
.lottery-cell.draw-trigger {
  background: #c04b23;
  color: #fff7e7;
  padding: 8px 3px;
}
.no-prize {
  color: #756f5a;
}
</style>
