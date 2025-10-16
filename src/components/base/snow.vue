<script setup lang="ts">
import '@/assets/css/plugin/snow.css'
import { randomNum } from '@/utils/random'
import { v4 } from 'uuid'
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue'

const { img = 'https://oss.eventnet.cn/H5/zz/public/icon/snow.png' } = defineProps<{
  img?: string
}>()

const id = v4()

onMounted(() => {
  autoCreateSnow(document.getElementById(id) as HTMLDivElement)
})

let snowTimer: NodeJS.Timeout | undefined

onUnmounted(() => {
  clearTimeout(snowTimer)
})

let activated = true

onActivated(() => {
  activated = true
})

onDeactivated(() => {
  activated = false
})

const snowList = new Set<string>()
function autoCreateSnow(wrapper: HTMLDivElement) {
  if (document.visibilityState === 'visible' && activated) createSnow(wrapper)

  snowTimer = setTimeout(
    () => {
      autoCreateSnow(wrapper)
    },
    snowList.size < 30 ? randomNum(400, 1000) : randomNum(800, 1600),
  )
}

function createSnow(wrapper: HTMLDivElement) {
  if (!wrapper) return

  const snow = document.createElement('div')
  const snowImg = document.createElement('img')
  snowImg.style.width = '100%'
  snowImg.src = img

  snow.appendChild(snowImg)
  snowImg.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
    duration: randomNum(30000, 60000),
    iterations: Infinity,
  })

  const width = randomNum(10, 26)
  snow.style.position = 'absolute'
  snow.style.width = `${width}px`
  snow.style.left = `${randomNum(-2, 102)}%`
  snow.style.bottom = '100%'
  snow.style.zIndex = '1'
  snow.style.pointerEvents = 'none'
  snow.style.opacity = String(randomNum(8, 10) / 10)

  const snowId = v4()
  wrapper.appendChild(snow)
  snowList.add(snowId)

  snow.animate(
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
  ).onfinish = () => {
    snowImg.remove()
    snow.remove()
    snowList.delete(snowId)
  }
}
</script>

<template>
  <div :id="id" class="pointer-events-none relative -z-10"></div>
</template>
