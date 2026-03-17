<script setup lang="ts">
import { sleep } from '@/utils/common'
import { randomInt } from 'es-toolkit'
import { createVNode, nextTick, onBeforeUnmount, render, toRaw, type CSSProperties } from 'vue'
import BarrageCard from './barrage-card.vue'

const {
  row = 6,
  space = 3,
  speed = [120, 80, 100, 90, 110],
} = defineProps<{ row?: number; space?: number | [number, number]; speed?: number | number[] }>()

const barrageList = defineModel<TBarrage[]>('barrageList', { required: true })
let conveyorList: TBarrage[] = []
let disposed = false
let started = false

const activeTasks = new Set<gsap.core.Tween>()
const cardMountNodes = new Set<HTMLDivElement>()

const addCard = (barrage: TBarrage) => {
  if (disposed) return
  barrageList.value.push(barrage)
  conveyorList.push({ ...barrage, pin: true })
}

const deleteCard = (id: number) => {
  if (disposed) return
  barrageList.value = (barrageList.value || []).filter((i) => i.id != id)
  conveyorList = (conveyorList || []).filter((i) => i.id != id)

  gsap.to(`.card-true-id-${id}`, { opacity: 1, scale: 0 })
}

const cardBoxMap = new Map<number, HTMLElement>()
const vw1 = innerWidth / 100

const createCard = async (id: number, gap: number) => {
  if (disposed) return
  let el = cardBoxMap.get(id)
  if (!el) {
    el = document.getElementById(`card-box-${id}`)!
    if (el) cardBoxMap.set(id, el)
  }
  if (!el) return console.error('card box is null')

  if (!conveyorList.length) conveyorList = [...toRaw(barrageList.value)]
  const card = conveyorList.pop()!
  if (!card) {
    await sleep(1200)
    if (disposed) return
    createCard(id, gap)
    return
  }

  const div = document.createElement('div')
  div.classList.add(`card-item-${card.id}`)
  const marginGap = vw1 * gap

  const height = 60
  Object.assign(div.style, {
    height: `${height}%`,
    left: el.clientWidth + marginGap + 'px',
    willChange: 'transform, opacity',
    top: randomInt(5, 100 - height - 5) + '%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  } satisfies CSSProperties)

  const div2 = document.createElement('div')
  div2.style.height = '100%'
  div2.classList.add(`card-true-id-${card.id}`)
  cardMountNodes.add(div2)
  div.appendChild(div2)

  const vNode = createVNode(BarrageCard, { barrage: card })
  render(vNode, div2)
  el.appendChild(div)

  await nextTick()
  await sleep(100)
  if (disposed) return
  const dom = vNode.el as HTMLElement
  const { width, right } = dom.getBoundingClientRect()

  const _speed = typeof speed === 'number' ? speed : speed[id - 1] || speed[0]!
  const duration = right / ((_speed * vw1) / 10)

  let isCreated = false
  const triggerDistance = width + marginGap
  const triggerTime = (triggerDistance / right) * duration

  const nextCardTimer = gsap.delayedCall(triggerTime, () => {
    if (isCreated) return
    isCreated = true
    createCard(id, typeof space === 'number' ? space : randomInt(space[0], space[1]))
  })
  activeTasks.add(nextCardTimer)

  const moveTween = gsap.to(div, {
    x: -right,
    duration: duration,
    ease: 'none',
    z: 0,
    onComplete() {
      activeTasks.delete(moveTween)
      nextCardTimer.kill()
      activeTasks.delete(nextCardTimer)
      render(null, div2)
      cardMountNodes.delete(div2)
      div.remove()
    },
  })
  activeTasks.add(moveTween)
}

const start = () => {
  if (started || disposed) return
  started = true
  for (let index = 1; index <= row; index++) {
    createCard(index, (index - 1) * 2)
  }
}

const stop = () => {
  disposed = true
  activeTasks.forEach((task) => task.kill())
  activeTasks.clear()

  cardMountNodes.forEach((mountNode) => {
    render(null, mountNode)
    mountNode.parentElement?.remove()
  })
  cardMountNodes.clear()
  cardBoxMap.clear()
}

onBeforeUnmount(() => {
  stop()
})

defineExpose({ deleteCard, addCard, start, stop })
</script>

<template>
  <div
    v-for="item in row"
    :id="`card-box-${item}`"
    :key="item"
    :style="{ height: `${100 / row}%` }"
    :class="`center relative w-full`"
  ></div>
</template>
