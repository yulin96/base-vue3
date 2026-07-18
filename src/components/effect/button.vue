<script setup lang="ts">
import { useActive } from '@/hooks/state/useActive'
import { random, randomInt, sample } from 'es-toolkit'
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

interface Props {
  count?: number
  color?: string | string[]
  bubbleSize?: number | [number, number]
}

const defaultColor = '#402612'
const props = withDefaults(defineProps<Props>(), {
  count: 10,
  color: defaultColor,
  bubbleSize: 5,
})

const active = useActive()
const buttonRef = useTemplateRef<HTMLDivElement>('buttonRef')

const bubbles = new Set<HTMLElement>()
const animations = new Set<gsap.core.Tween>()
let createTimer: number | null = null
let resizeObserver: ResizeObserver | null = null
let containerWidth = 0
let containerHeight = 0
let disposed = false

const clearCreateTimer = () => {
  if (createTimer === null) return
  window.clearTimeout(createTimer)
  createTimer = null
}

const getBubbleColor = () => {
  if (!Array.isArray(props.color)) return props.color
  return sample(props.color) ?? defaultColor
}

const createBubble = () => {
  const container = buttonRef.value
  if (!container || containerWidth <= 0 || containerHeight <= 0) return false

  const bubble = document.createElement('i')
  const size = Array.isArray(props.bubbleSize) ? randomInt(...props.bubbleSize) : props.bubbleSize
  const maxPosition = Math.max(0, containerWidth - size)
  const horizontalPadding = Math.min(12, maxPosition / 2)
  const position = random(horizontalPadding, maxPosition - horizontalPadding)
  const duration = random(1.6, 2.6)

  Object.assign(bubble.style, {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    position: 'absolute',
    zIndex: '-10',
    backgroundColor: getBubbleColor(),
    left: `${position}px`,
    bottom: `-${size}px`,
  })

  bubbles.add(bubble)
  container.appendChild(bubble)

  const animation = gsap.to(bubble, {
    y: -containerHeight / 1.2,
    opacity: 0,
    duration,
    ease: 'power1.inOut',
    onComplete: () => {
      bubble.remove()
      bubbles.delete(bubble)
      animations.delete(animation)
      scheduleCreate()
    },
  })
  animations.add(animation)

  return true
}

function scheduleCreate(delay = 120) {
  if (disposed || !active.value || createTimer !== null || bubbles.size >= props.count) return

  createTimer = window.setTimeout(() => {
    createTimer = null
    if (createBubble()) scheduleCreate()
  }, delay)
}

const updateContainerSize = () => {
  const container = buttonRef.value
  if (!container) return

  containerWidth = container.clientWidth
  containerHeight = container.clientHeight
  scheduleCreate(0)
}

watch(active, (isActive) => {
  if (isActive) {
    updateContainerSize()
  } else {
    clearCreateTimer()
  }
})

watch(
  () => props.count,
  () => {
    clearCreateTimer()
    scheduleCreate(0)
  },
)

onMounted(() => {
  disposed = false
  updateContainerSize()

  resizeObserver = new ResizeObserver(updateContainerSize)
  if (buttonRef.value) resizeObserver.observe(buttonRef.value)
})

onUnmounted(() => {
  disposed = true
  clearCreateTimer()
  resizeObserver?.disconnect()
  resizeObserver = null

  animations.forEach((animation) => animation.kill())
  animations.clear()
  bubbles.forEach((bubble) => bubble.remove())
  bubbles.clear()
})
</script>

<template>
  <div class="button center absolute inset-0 z-0 size-full overflow-hidden">
    <div
      ref="buttonRef"
      class="pointer-events-none absolute top-0 left-0 -z-10 flex h-full w-full items-center justify-evenly"
    ></div>
    <slot></slot>
  </div>
</template>
