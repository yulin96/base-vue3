<script setup lang="ts">
import { useDocumentVisibility } from '@vueuse/core'
import { random, randomInt, sample } from 'es-toolkit'
import { onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  autoStart?: boolean
  maxStars?: number
  minInterval?: number
  maxInterval?: number
  minSize?: number
  maxSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true,
  maxStars: 20,
  minInterval: 50,
  maxInterval: 1000,
  minSize: 2,
  maxSize: 6,
})

const starsBoxRef = ref<HTMLDivElement>()
const visibility = useDocumentVisibility()
let timeoutId: number | null = null
let isRunning = false
const animations = new Set<gsap.core.Tween>()

const getInterval = (currentStarCount: number) => {
  if (currentStarCount >= Math.max(0, Math.floor(props.maxStars))) {
    return Math.max(16, props.maxInterval)
  }

  const min = Math.max(16, Math.min(props.minInterval, props.maxInterval))
  const max = Math.max(min, Math.min(100, props.maxInterval))
  return Math.round(random(min, max))
}

const loopCreate = () => {
  if (!isRunning) return
  if (!starsBoxRef.value) return

  const currentStarCount = starsBoxRef.value.children.length
  const interval = getInterval(currentStarCount)

  timeoutId = window.setTimeout(() => {
    loopCreate()
    if (visibility.value === 'visible' && isRunning && starsBoxRef.value) {
      createStar(starsBoxRef.value)
    }
  }, interval)
}

const start = () => {
  if (isRunning) return
  isRunning = true
  loopCreate()
}

const stop = () => {
  isRunning = false
  if (timeoutId !== null) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

const destroy = () => {
  stop()
  animations.forEach((animation) => animation.kill())
  animations.clear()
  while (starsBoxRef.value && starsBoxRef.value.firstChild) {
    starsBoxRef.value.removeChild(starsBoxRef.value.firstChild)
  }
}

function createStar(starsBox: HTMLDivElement) {
  if (starsBox.children.length >= Math.max(0, Math.floor(props.maxStars))) return

  const star = document.createElement('div')

  const size = Math.floor(randomInt(props.minSize, props.maxSize))
  star.style.width = `${size}px`
  star.style.height = `${size}px`
  star.style.backgroundColor = '#fff'
  star.style.borderRadius = '50%'
  star.style.boxShadow = `0 0 ${size}px 1px #fff9`
  star.style.opacity = '0'
  star.style.position = 'absolute'
  star.style.transform = `rotate(${randomInt(0, 360)}deg) scale(0)`
  star.style.left = `${Math.floor(randomInt(0, starsBox.clientWidth - 0))}px`
  star.style.top = `${Math.floor(randomInt(0, starsBox.clientHeight - 0))}px`

  starsBox.appendChild(star)

  const duration = randomTwoFloat(2, 4)
  const moveTween = gsap.to(star, { x: random(-12, 12), y: random(-12, 12), ease: 'none', duration: duration * 2 })
  const fadeTween = gsap.to(star, {
    opacity: 1,
    scale: randomTwoFloat(0.9, 1),
    duration: duration,
    repeat: 1,
    yoyo: true,
    ease: randomCubicBezier(),
    repeatDelay: randomTwoFloat(0.6, 1),
    onComplete: () => {
      animations.delete(moveTween)
      animations.delete(fadeTween)
      moveTween.kill()
      star.remove()
    },
  })
  animations.add(moveTween)
  animations.add(fadeTween)
}

function randomCubicBezier() {
  return sample([
    'cubic-bezier(0.33, 0.75, 0.19, 1)',
    'cubic-bezier(0.62, 0.68, 0.67, 0.99)',
    'cubic-bezier(0.09, 0.67, 0.06, 0.98)',
    'cubic-bezier(0.42, 0.81, 0.72, 1.13)',
    'cubic-bezier(0.71, 0.47, 0.45, 0.98)',
  ])
}

function randomTwoFloat(min: number, max: number) {
  return +random(min, max).toFixed(2)
}

onMounted(() => {
  if (starsBoxRef.value) {
    const style = window.getComputedStyle(starsBoxRef.value)
    const position = style.position
    if (!position || position === 'static') {
      starsBoxRef.value.style.position = 'relative'
    }
  }

  if (props.autoStart) {
    start()
  }
})

onActivated(() => {
  if (props.autoStart) {
    start()
  }
})

onDeactivated(() => {
  stop()
})

onUnmounted(() => {
  destroy()
})

watch(visibility, (newVisibility) => {
  if (newVisibility === 'hidden') {
    stop()
  } else if (newVisibility === 'visible' && props.autoStart) {
    start()
  }
})

watch(
  () => props.autoStart,
  (autoStart) => {
    if (autoStart && visibility.value === 'visible') start()
    else stop()
  },
)

defineExpose({
  start,
  stop,
  destroy,
})
</script>

<template>
  <div ref="starsBoxRef" class="pointer-events-none absolute inset-0 size-full overflow-hidden"></div>
</template>
