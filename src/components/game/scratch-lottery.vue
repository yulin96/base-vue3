<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onMounted, useTemplateRef } from 'vue'

const {
  percentage = 60,
  strokeSize = 16,
  text = '刮开',
} = defineProps<{
  percentage?: number
  strokeSize?: number
  text?: string
}>()

const emits = defineEmits<{ success: [] }>()

const DPR = window.devicePixelRatio || 1

const lotteryCanvas = useTemplateRef('lotteryCanvas')

let ctx: CanvasRenderingContext2D | null = null
let completed = false
useEventListener(lotteryCanvas, 'touchstart', (e) => {
  e.stopPropagation()
  e.preventDefault()
})

useEventListener(lotteryCanvas, 'touchmove', (e) => {
  e.stopPropagation()
  e.preventDefault()

  if (!lotteryCanvas.value || !ctx) return

  const rect = lotteryCanvas.value.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(touch.clientX - rect.left, touch.clientY - rect.top, strokeSize, 0, Math.PI * 2, false)
  ctx.fill()
})

useEventListener(lotteryCanvas, 'touchend', (e) => {
  e.stopPropagation()
  e.preventDefault()

  if (!lotteryCanvas.value || !ctx) return

  if (!completed && checkScratchCompletion(lotteryCanvas.value, ctx)) {
    completed = true
    emits('success')
  }
})

function initLottery() {
  if (!lotteryCanvas.value) return

  ctx = lotteryCanvas.value.getContext('2d', { willReadFrequently: true })!
  if (!ctx) return

  // CSS 像素尺寸（用于所有绘图坐标，因为已 ctx.scale(DPR)）
  const cssWidth = +getComputedStyle(lotteryCanvas.value).width.replace('px', '')
  const cssHeight = +getComputedStyle(lotteryCanvas.value).height.replace('px', '')

  // 物理像素尺寸（仅用于 canvas buffer 分辨率）
  lotteryCanvas.value.width = cssWidth * DPR
  lotteryCanvas.value.height = cssHeight * DPR
  ctx.scale(DPR, DPR)

  clearCanvas(lotteryCanvas.value, ctx)

  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#757575'
  ctx.fillRect(0, 0, cssWidth, cssHeight)

  ctx.font = '12px cjd'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '2px'
  ctx.fillText(text, cssWidth / 2, cssHeight / 2)
}

function clearCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function checkScratchCompletion(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  let scratchedPixels = 0
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) {
      scratchedPixels++
    }
  }
  const totalPixels = canvas.width * canvas.height
  const scratchPercent = (scratchedPixels / totalPixels) * 100

  return scratchPercent > percentage
}

const reset = () => {
  completed = false
  initLottery()
}

onMounted(() => {
  initLottery()
})

defineExpose({ reset })
</script>

<template>
  <canvas ref="lotteryCanvas"></canvas>
</template>
