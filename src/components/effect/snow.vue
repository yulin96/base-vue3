<script setup lang="ts">
import { randomNum } from '@/utils/random'
import { onActivated, onDeactivated, onMounted, onUnmounted, useTemplateRef } from 'vue'

const { img = 'https://oss.eventnet.cn/H5/zz/public/icon/snow.png' } = defineProps<{
  img?: string
}>()

const snowRef = useTemplateRef<HTMLDivElement>('snowRef')

onMounted(() => {
  startSnow()
})

let snowTimer: ReturnType<typeof setTimeout> | undefined
const runningAnimations = new Set<Animation>()

onUnmounted(() => {
  stopSnow()
  // 取消所有正在运行的动画
  runningAnimations.forEach((a) => a.cancel())
  runningAnimations.clear()
})

let activated = true

onActivated(() => {
  activated = true
  runningAnimations.forEach((animation) => animation.play())
  startSnow()
})

onDeactivated(() => {
  activated = false
  stopSnow()
  runningAnimations.forEach((animation) => animation.pause())
})

let snowCount = 0
function startSnow() {
  if (snowTimer !== undefined || !activated || !snowRef.value) return
  autoCreateSnow(snowRef.value)
}

function stopSnow() {
  if (snowTimer === undefined) return
  clearTimeout(snowTimer)
  snowTimer = undefined
}

function autoCreateSnow(wrapper: HTMLDivElement) {
  if (document.visibilityState === 'visible' && activated) createSnow(wrapper)

  snowTimer = setTimeout(
    () => {
      snowTimer = undefined
      if (!activated) return
      autoCreateSnow(wrapper)
    },
    snowCount < 30 ? randomNum(400, 1000) : randomNum(800, 1600),
  )
}

function createSnow(wrapper: HTMLDivElement) {
  if (!wrapper) return

  const snow = document.createElement('div')
  const snowImg = document.createElement('img')
  snowImg.style.width = '100%'
  snowImg.src = img

  snow.appendChild(snowImg)
  const rotateAnim = snowImg.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
    duration: randomNum(30000, 60000),
    iterations: Infinity,
  })
  runningAnimations.add(rotateAnim)

  const width = randomNum(10, 26)
  snow.style.position = 'absolute'
  snow.style.width = `${width}px`
  snow.style.left = `${randomNum(-2, 102)}%`
  snow.style.bottom = '100%'
  snow.style.zIndex = '1'
  snow.style.pointerEvents = 'none'
  snow.style.opacity = String(randomNum(8, 10) / 10)

  wrapper.appendChild(snow)
  snowCount++

  const moveAnim = snow.animate(
    [
      { transform: 'translateY(0) translateZ(0) translateX(0)' },
      {
        transform: `translateY(${innerHeight + width}px) translateZ(0) translateX(${randomNum(-20, 20)}px)`,
      },
    ],
    {
      duration: randomNum(12000, 20000),
      easing: 'cubic-bezier(0.2, 0, 0.8, 0.8)',
    },
  )
  runningAnimations.add(moveAnim)

  moveAnim.onfinish = () => {
    runningAnimations.delete(rotateAnim)
    runningAnimations.delete(moveAnim)
    rotateAnim.cancel()
    snowImg.remove()
    snow.remove()
    snowCount--
  }
}
</script>

<template>
  <div ref="snowRef" class="pointer-events-none relative -z-10"></div>
</template>
