<script setup lang="ts">
import pinSvg from '@/assets/imgs/pin.svg'
import { randomString } from '@/utils/random'
import { random, sample } from 'es-toolkit'
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

const uuid = randomString()
const uuid2 = randomString()

interface BarrageColor {
  background: string
  foreground: string
}

const defaultColors: BarrageColor[] = [
  { background: '#FC6760', foreground: '#fff' },
  { background: '#5DEC6D', foreground: '#fff' },
  { background: '#57A8EA', foreground: '#fff' },
  { background: '#4C94FD', foreground: '#fff' },
  { background: '#E88823', foreground: '#fff' },
  { background: '#FFFF48', foreground: '#333' },
]

const {
  gap = 20,
  speed = 90,
  barrageList,
  colors = defaultColors,
  pinColor = { background: '#493D9E', foreground: '#fff' },
} = defineProps<{
  barrageList: Array<any>
  gap?: number
  speed?: number
  colors?: BarrageColor[]
  pinColor?: BarrageColor
}>()

const currentId = defineModel<number>({ required: true })

const barrageBox = useTemplateRef('barrageBox')
const isPaused = ref(false)
const animations = new Set<gsap.core.Tween>()
let rafId: number | null = null
let clientWidth = innerWidth

const pause = () => {
  isPaused.value = true
}

const resume = () => {
  isPaused.value = false
}

onMounted(() => {
  const box = document.querySelector(`[uuid="${uuid}"]`) as HTMLDivElement | null
  if (!box) return console.error('box is null')
  clientWidth = barrageBox.value?.clientWidth || innerWidth
  for (const item of box.children) {
    item.classList.add(uuid2)
  }

  const parents = document.querySelectorAll(`.${uuid2}`) as NodeListOf<HTMLDivElement>

  const autoCreateBarrage = () => {
    if (!isPaused.value) {
      createBarrage({ params: barrageList[currentId.value], gap, speed, parents })
    }
    rafId = requestAnimationFrame(autoCreateBarrage)
  }
  autoCreateBarrage()
})

onUnmounted(() => {
  // 清理 requestAnimationFrame
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  // 清理所有 GSAP 动画
  animations.forEach((anim) => {
    anim.kill()
  })
  animations.clear()
})

async function createBarrage({
  params,
  gap,
  speed,
  parents,
}: {
  params: {
    content: string
    pin?: boolean
  }
  gap: number
  speed: number
  parents: NodeListOf<HTMLDivElement>
}) {
  if (!params) return

  const index = Array.from(parents).findIndex((item) => {
    return (
      item.lastChild === null ||
      (item.lastChild as HTMLDivElement).getBoundingClientRect().right <
        (barrageBox.value?.getBoundingClientRect().right || clientWidth)
    )
  })

  if (index === -1) return

  currentId.value = (currentId.value + 1) % barrageList.length

  const barrage = document.createElement('div')
  barrage.classList.add('barrage')
  barrage.classList.add(sample(['left', 'right']))
  gap = random(12, 50)
  barrage.style.left = `${clientWidth + gap}px`
  barrage.innerHTML = `
    <span>${params.content}</span>
    ${params.pin ? `<img class="pin_my" src="${pinSvg}" />` : ''}
  `

  const { background, foreground } = params.pin ? pinColor : sample(colors)
  barrage.style.backgroundColor = background
  barrage.style.color = foreground
  if (params.pin) {
    barrage.style.fontWeight = 'bold'
  }
  barrage.style.setProperty('--data-color', background)

  params.pin = false

  const parent = parents[index]
  if (!parent) return
  parent.appendChild(barrage)

  const offset = Math.floor(clientWidth + barrage.clientWidth + gap)

  const tween = gsap.to(barrage, {
    x: -offset,
    duration: offset / speed,
    ease: 'none',
    onComplete: () => {
      if (parent && barrage.parentNode === parent) {
        parent.removeChild(barrage)
      }
      animations.delete(tween)
    },
  })

  animations.add(tween)
}

defineExpose({ pause, resume })

/**
  <com-barrage v-model="currentId" class="mt-100" :barrage-list="data">
    <div class="flex h-100 w-full items-center"></div>
    <div class="mt-60 flex h-100 w-full items-center"></div>
    <div class="mt-60 flex h-100 w-full items-center"></div>
    <div class="mt-60 flex h-100 w-full items-center"></div>
  </com-barrage>
 */
</script>

<template>
  <div v-bind="{ uuid }" ref="barrageBox" class="barrage-box w-full">
    <slot>
      <div></div>
    </slot>
  </div>
</template>

<style>
.barrage {
  position: absolute;
  border-radius: 50px;
  /* background-color: #eaf7ff; */
  /* border: 2px solid #333; */
  width: max-content;
  /* padding: 12px 26px; */
  padding: 4px 26px;
  font-size: 24px;
  display: flex;
  align-items: center;
}

.barrage .pin_my {
  width: 40px;
  height: 40px;
  position: absolute;
  top: -12px;
  right: -12px;
}

.barrage.left::after {
  content: '';
  width: 0;
  height: 0;
  position: absolute;
  top: 100%;
  left: 20px;
  border-width: 8px 12px;
  border-color: var(--data-color) transparent transparent var(--data-color);
}

.barrage.right::after {
  content: '';
  width: 0;
  height: 0;
  position: absolute;
  top: 100%;
  right: 20px;
  border-width: 8px 12px;
  border-color: var(--data-color) var(--data-color) transparent transparent;
}

.barrage img:nth-child(1) {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: inline-block;
}

.barrage span:nth-child(2) {
  margin-left: 10px;
}
</style>
