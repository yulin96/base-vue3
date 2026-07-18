<script setup lang="ts">
import { sleep } from '@/utils/common'
import { randomInt } from 'es-toolkit'
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    texts: string[]
    speed?: number | [number, number]
  }>(),
  {
    speed: 90,
  },
)

const lineRef = useTemplateRef('lineRef')
const lineWidth = ref<number[]>([])

const lines = ref<string[]>([])
const currentIndex = ref(0)
let disposed = false
let mounted = false
let writingSessionId = 0

// 使用 canvas measureText 优化文本宽度计算
const measureTextWidth = (text: string): number => {
  if (!lineRef.value) return 0

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0

  const computedStyle = getComputedStyle(lineRef.value)
  ctx.font = computedStyle.font || '16px sans-serif'

  return ctx.measureText(text).width
}

const writeText = async (sessionId: number) => {
  if (disposed || sessionId !== writingSessionId) return

  const idx = currentIndex.value
  if (idx >= props.texts.length) return

  if (!lines.value[idx]) lines.value[idx] = ''

  const characters = Array.from(props.texts[idx] ?? '')
  const shown = Array.from(lines.value[idx]).length
  if (shown < characters.length) {
    lines.value[idx] += characters[shown]
  } else if (idx < props.texts.length - 1) {
    currentIndex.value++
  } else if (idx == props.texts.length - 1) {
    return
  }

  const time = Array.isArray(props.speed) ? randomInt(props.speed[0], props.speed[1]) : props.speed

  await sleep(time)
  if (disposed || sessionId !== writingSessionId) return
  void writeText(sessionId)
}

const restart = async () => {
  const sessionId = ++writingSessionId
  lines.value = []
  currentIndex.value = 0
  lineWidth.value = []

  await nextTick()
  if (disposed || sessionId !== writingSessionId) return

  // 使用 canvas 测量文本宽度,避免创建临时 DOM 元素
  lineWidth.value = props.texts.map(measureTextWidth)
  void writeText(sessionId)
}

onMounted(() => {
  mounted = true
  void restart()
})

onUnmounted(() => {
  disposed = true
  writingSessionId++
})

watch(
  () => props.texts,
  () => {
    if (mounted) void restart()
  },
  { deep: true },
)
// <com-typewriter
//     :texts="['别急', '月亮总会在云后升起', '就算黑夜漫长', '也挡不住清晨那一缕微光']"
//     :speed="[90, 160]"
// ></com-typewriter>
</script>

<template>
  <div ref="lineRef" class="flex w-full flex-col items-center">
    <div v-for="(_, index) in texts" :key="index" :style="{ width: lineWidth[index] + 'px' }" class="whitespace-nowrap">
      <span v-for="(text, charIndex) in lines[index]" :key="charIndex" class="fadeIn">{{ text }}</span>

      <span v-show="currentIndex === index" class="animate-[caret-blink_0.8s_infinite] ease-out">_</span>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.fadeIn {
  animation: fadeIn 0.2s ease-in-out;
}
</style>
