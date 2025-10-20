<script setup lang="ts">
import { sleep } from '@/shared/common'
import { randomInt } from 'es-toolkit'
import { createApp, nextTick, toRaw, type CSSProperties } from 'vue'
import BarrageCard from './barrage-card.vue'

const {
  row = 6,
  space = 3,
  speed = [120, 80, 100, 90, 110],
  // [120, 80, 100, 90, 110],
} = defineProps<{ row?: number; space?: number | [number, number]; speed?: number | number[] }>()

const barrageList = defineModel<TBarrage[]>('barrageList', { required: true })
let conveyorList: TBarrage[] = []

const addCard = (barrage: TBarrage) => {
  barrageList.value.push(barrage)
  conveyorList.push({ ...barrage, pin: true })
}

const deleteCard = (id: number) => {
  barrageList.value = (barrageList.value || []).filter((i) => i.id != id)
  conveyorList = (conveyorList || []).filter((i) => i.id != id)

  gsap.to(`.card-true-id-${id}`, { opacity: 1, scale: 0 })
}

const cardBoxMap = new Map<number, HTMLElement>()
const vw1 = innerWidth / 100

const createCard = async (id: number, gap: number) => {
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
  div.appendChild(div2)

  const app = createApp(BarrageCard, { barrage: card })
  const ele = app.mount(div2)
  el.appendChild(div)

  await nextTick()
  await sleep(100)
  const dom = ele.$el as HTMLElement
  const { width, right } = dom.getBoundingClientRect()

  const _speed = typeof speed === 'number' ? speed : speed[id - 1] || speed[0]!
  const duration = right / ((_speed * vw1) / 10)

  let isCreated = false
  const _ani = gsap.to(div, {
    x: -right,
    duration: duration,
    ease: 'none',
    z: 0,
    onUpdate() {
      if (isCreated) return
      const currentX = gsap.getProperty(div, 'x') as number
      if (currentX <= -(width + marginGap) && !isCreated) {
        isCreated = true
        createCard(id, typeof space === 'number' ? space : randomInt(space[0], space[1]))
      }
    },
    onComplete() {
      _ani.kill()
      app.unmount()
      div.remove()
    },
  })
}

const start = () => {
  for (let index = 1; index <= row; index++) {
    createCard(index, (index - 1) * 2)
  }
}

defineExpose({ deleteCard, addCard, start })
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
