<script setup lang="ts">
import { sleep } from '@/shared/common'
import { randomInt } from 'es-toolkit'
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'

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
const lineWidth: number[] = []

const lines = ref<string[]>([])
const currentIndex = ref(0)

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

const writeText = async () => {
  const idx = currentIndex.value
  if (idx >= props.texts.length) return

  if (!lines.value[idx]) lines.value[idx] = ''

  const line = props.texts[idx]
  const shown = lines.value[idx].length
  if (!line) return
  if (shown < line.length) {
    lines.value[idx] += line[shown]
  } else if (idx < props.texts.length - 1) {
    currentIndex.value++
  } else if (idx == props.texts.length - 1) {
    return
  }

  const time = Array.isArray(props.speed) ? randomInt(props.speed[0], props.speed[1]) : props.speed

  await sleep(time)
  writeText()
}

onMounted(async () => {
  // 使用 canvas 测量文本宽度,避免创建临时 DOM 元素
  props.texts.forEach((text) => {
    lineWidth.push(measureTextWidth(text))
  })

  await nextTick()
  writeText()
})
// <com-typewriter
//     :texts="['别急', '月亮总会在云后升起', '就算黑夜漫长', '也挡不住清晨那一缕微光']"
//     :speed="[90, 160]"
// ></com-typewriter>
</script>

<template>
  <div ref="lineRef" class="flex w-full flex-col items-center">
    <div v-for="(_, index) in texts" :key="index" :style="{ width: lineWidth[index] + 'px' }" class="whitespace-nowrap">
      <span v-for="text in lines[index]" :key="text" class="fadeIn">{{ text }}</span>

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
