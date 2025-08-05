<script setup lang="ts">
import { useActive } from '@/hooks/useActive'
import { sleep } from '@/shared/common'
import { random, randomInt, range, sample } from 'es-toolkit'
import { onMounted, useTemplateRef } from 'vue'

const active = useActive()

const {
  count = 10,
  bubbleColor = '#402612',
  bubbleSize = 5,
} = defineProps<{
  count?: number
  bubbleColor?: string | string[]
  bubbleSize?: number | [number, number]
}>()

const buttonRef = useTemplateRef('buttonRef')

const bubbles = new Map()
const createBubbles = async () => {
  if (bubbles.size < count && active.value) {
    if (!buttonRef.value) return
    const bubble = document.createElement('i')
    const size = Array.isArray(bubbleSize) ? randomInt(...bubbleSize) : bubbleSize
    bubble.style.width = `${size}px`
    bubble.style.height = `${size}px`
    bubble.style.borderRadius = '9999px'
    bubble.style.position = 'absolute'
    bubble.style.zIndex = '-10'
    bubble.style.backgroundColor = Array.isArray(bubbleColor) ? sample(bubbleColor) : bubbleColor
    let position: number | undefined
    while (!position || bubbles.has(position)) {
      position = sample(
        range(12, buttonRef.value!.clientWidth! - 12, Math.floor(buttonRef.value!.clientWidth / count / 2)),
      )
    }

    bubbles.set(position, bubble)
    bubble.style.left = `${position}px`
    bubble.style.bottom = `-${size}px`
    buttonRef.value.appendChild(bubble)

    const duration = random(1.6, 2.6)

    gsap
      .timeline()
      .to(bubble, { y: -buttonRef.value.offsetHeight / 1.2, duration: duration, ease: 'easeInOut' })
      .to(bubble, { opacity: 0, duration: duration, ease: 'easeInOut' }, '<')
      .then(() => {
        buttonRef.value!.removeChild(bubble)
        bubbles.delete(position)
      })
  }

  await sleep(120)
  requestAnimationFrame(createBubbles)
}

onMounted(() => {
  createBubbles()
})
</script>

<template>
  <div class="button center relative z-0 overflow-hidden">
    <div
      ref="buttonRef"
      class="pointer-events-none absolute top-0 left-0 -z-10 flex h-full w-full items-center justify-evenly"
    ></div>
    <slot></slot>
  </div>
</template>
