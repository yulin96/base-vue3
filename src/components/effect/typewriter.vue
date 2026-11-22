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

const lines = ref<string[][]>([])
const currentIndex = ref(0)
let disposed = false
let mounted = false
let writingSessionId = 0

const characterDelay = () => (Array.isArray(props.speed) ? randomInt(...props.speed) : props.speed)

const restart = async () => {
  const sessionId = ++writingSessionId
  lines.value = []
  currentIndex.value = 0
  lineWidth.value = []

  await nextTick()
  if (disposed || sessionId !== writingSessionId) return

  const ctx = document.createElement('canvas').getContext('2d')
  if (ctx && lineRef.value) {
    ctx.font = getComputedStyle(lineRef.value).font || '16px sans-serif'
    lineWidth.value = props.texts.map((text) => ctx.measureText(text).width)
  }

  for (const [index, text] of props.texts.entries()) {
    currentIndex.value = index
    lines.value[index] = []
    for (const character of text) {
      lines.value[index].push(character)
      await sleep(characterDelay())
      if (disposed || sessionId !== writingSessionId) return
    }
    if (index < props.texts.length - 1) {
      await sleep(characterDelay())
      if (disposed || sessionId !== writingSessionId) return
    }
  }
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
