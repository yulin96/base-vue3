<script setup lang="ts">
import { gsap } from 'gsap'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'

import cardClosed1 from '@/assets/images/download-1.png'
import cardOpened1 from '@/assets/images/download-1s.png'
import cardClosed2 from '@/assets/images/download-2.png'
import cardOpened2 from '@/assets/images/download-2s.png'
import cardClosed3 from '@/assets/images/download-3.png'
import cardOpened3 from '@/assets/images/download-3s.png'
import cardClosed4 from '@/assets/images/download-4.png'
import cardOpened4 from '@/assets/images/download-4s.png'
import cardClosed5 from '@/assets/images/download-5.png'
import cardOpened5 from '@/assets/images/download-5s.png'
import cardClosed0 from '@/assets/images/download.png'
import cardOpened0 from '@/assets/images/downloads.png'
import kvImage from '@/assets/images/kv.png'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

interface CardItem {
  id: number
  closed: string
  opened: string
}

interface DragState {
  id: number
  startX: number
  startY: number
  x: number
  y: number
  moved: boolean
  pointerId: number
}

const cards: CardItem[] = [
  { id: 0, closed: cardClosed0, opened: cardOpened0 },
  { id: 1, closed: cardClosed1, opened: cardOpened1 },
  { id: 2, closed: cardClosed2, opened: cardOpened2 },
  { id: 3, closed: cardClosed3, opened: cardOpened3 },
  { id: 4, closed: cardClosed4, opened: cardOpened4 },
  { id: 5, closed: cardClosed5, opened: cardOpened5 },
]

const stackOrder = ref([5, 4, 3, 2, 1, 0])
const cardElements = reactive(new Map<number, HTMLElement>())
const activeId = computed(() => stackOrder.value[0])
const isAnimating = ref(false)
const dragState = ref<DragState | null>(null)
const layoutRatio = ref(0.5)

const stackLayout = [
  { y: 740, scale: 1.12, rotate: 0, opacity: 1 },
  { y: 548, scale: 0.98, rotate: -0.28, opacity: 1 },
  { y: 396, scale: 0.91, rotate: 0.22, opacity: 1 },
  { y: 254, scale: 0.85, rotate: -0.18, opacity: 1 },
  { y: 118, scale: 0.79, rotate: 0.14, opacity: 1 },
  { y: 52, scale: 0.73, rotate: -0.1, opacity: 0 },
]

const toScreen = (value: number) => value * layoutRatio.value

const displayCards = computed(() =>
  stackOrder.value
    .map((id, position) => {
      const card = cards.find((item) => item.id === id)!
      return {
        ...card,
        position,
        image: position === 0 ? card.opened : card.closed,
      }
    })
    .reverse(),
)

const setCardElement = (id: number, element: unknown) => {
  if (element instanceof HTMLElement) {
    cardElements.set(id, element)
    return
  }

  cardElements.delete(id)
}

const getCardPosition = (id: number) => stackOrder.value.findIndex((cardId) => cardId === id)

const animateStack = async (immediate = false) => {
  await nextTick()

  stackOrder.value.forEach((id, position) => {
    const element = cardElements.get(id)
    const layout = stackLayout[position]
    if (!element || !layout) return

    gsap.to(element, {
      xPercent: -50,
      x: 0,
      y: toScreen(layout.y),
      scale: layout.scale,
      rotate: layout.rotate,
      opacity: layout.opacity,
      zIndex: cards.length - position,
      duration: immediate ? 0 : 0.66,
      ease: immediate ? 'none' : 'elastic.out(0.82, 0.62)',
      overwrite: true,
    })
  })
}

const activateCard = async (id: number) => {
  const position = getCardPosition(id)
  if (position <= 0 || isAnimating.value) return

  isAnimating.value = true
  const nextOrder = [...stackOrder.value.slice(position), ...stackOrder.value.slice(0, position)]
  const pushedIds = stackOrder.value.slice(0, position)

  pushedIds.forEach((cardId, index) => {
    const element = cardElements.get(cardId)
    if (!element) return

    gsap.to(element, {
      xPercent: -50,
      x: toScreen(index % 2 === 0 ? -64 : 64),
      y: toScreen(stackLayout[index].y + 88),
      rotate: index % 2 === 0 ? -7 : 7,
      scale: 0.88,
      duration: 0.22,
      ease: 'power2.in',
      overwrite: true,
    })
  })

  await new Promise((resolve) => window.setTimeout(resolve, 120))
  stackOrder.value = nextOrder
  await animateStack()
  await new Promise((resolve) => window.setTimeout(resolve, 560))
  isAnimating.value = false
}

const flyActiveCard = async (offsetX: number, offsetY: number) => {
  const currentId = activeId.value
  const element = cardElements.get(currentId)
  if (!element || isAnimating.value) return

  isAnimating.value = true
  const distance = Math.hypot(offsetX, offsetY) || 1
  const directionX = offsetX / distance
  const directionY = offsetY / distance
  const flyDistance = toScreen(1100)

  gsap.killTweensOf(element)
  await gsap.to(element, {
    xPercent: -50,
    x: directionX * flyDistance,
    y: toScreen(stackLayout[0].y) + directionY * flyDistance,
    rotate: directionX * 18,
    scale: 0.8,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.out',
    overwrite: true,
  })

  stackOrder.value = [...stackOrder.value.slice(1), currentId]
  await nextTick()

  gsap.set(element, {
    xPercent: -50,
    x: -directionX * toScreen(180),
    y: toScreen(stackLayout[cards.length - 1].y) - directionY * toScreen(120),
    opacity: 0,
    scale: stackLayout[cards.length - 1].scale,
  })

  await animateStack()
  await new Promise((resolve) => window.setTimeout(resolve, 560))
  isAnimating.value = false
}

const onPointerDown = (event: PointerEvent, id: number, position: number) => {
  if (position !== 0 || isAnimating.value) return

  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) return

  try {
    target.setPointerCapture(event.pointerId)
  } catch {
    void 0
  }
  dragState.value = {
    id,
    startX: event.clientX,
    startY: event.clientY,
    x: 0,
    y: 0,
    moved: false,
    pointerId: event.pointerId,
  }
}

const onPointerMove = (event: PointerEvent) => {
  const drag = dragState.value
  if (!drag || drag.pointerId !== event.pointerId || isAnimating.value) return

  drag.x = event.clientX - drag.startX
  drag.y = event.clientY - drag.startY
  drag.moved = Math.hypot(drag.x, drag.y) > 8

  const element = cardElements.get(drag.id)
  if (!element) return

  gsap.to(element, {
    xPercent: -50,
    x: drag.x,
    y: toScreen(stackLayout[0].y) + drag.y,
    rotate: drag.x * 0.025,
    duration: 0.12,
    ease: 'power2.out',
    overwrite: true,
  })
}

const onPointerUp = (event: PointerEvent) => {
  const drag = dragState.value
  if (!drag || drag.pointerId !== event.pointerId) return

  const element = cardElements.get(drag.id)
  try {
    if (element?.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId)
    }
  } catch {
    void 0
  }

  dragState.value = null

  if (drag.moved) {
    void flyActiveCard(drag.x, drag.y)
    return
  }
}

const onCardClick = (id: number, position: number) => {
  if (dragState.value?.moved) return

  if (position === 0) return
  void activateCard(id)
}

const updateLayoutRatio = () => {
  layoutRatio.value = Math.min(window.innerWidth, 750) / 750
  void animateStack(true)
}

onMounted(() => {
  updateLayoutRatio()
  window.addEventListener('resize', updateLayoutRatio)
  void animateStack(true)
  gsap.from('.hero-kv', {
    y: -18,
    opacity: 0,
    duration: 0.58,
    ease: 'power3.out',
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayoutRatio)
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content">
        <img class="hero-kv" :src="kvImage" alt="Eco Nexus" />

        <div class="card-stage" aria-label="download cards">
          <button
            v-for="card in displayCards"
            :key="card.id"
            :ref="(element) => setCardElement(card.id, element)"
            class="download-card"
            :class="{ 'is-active': card.position === 0 }"
            type="button"
            :style="{ zIndex: cards.length - card.position }"
            @click="onCardClick(card.id, card.position)"
            @pointerdown="onPointerDown($event, card.id, card.position)"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <img class="card-image" :src="card.image" alt="" draggable="false" />
          </button>
        </div>
      </main>
    </section>
  </div>
</template>

<style scoped>
.index {
  min-height: 100%;
  overflow: hidden;
  background: #000;
}

.content {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #000;
}

.hero-kv {
  position: absolute;
  top: 150px;
  left: 50%;
  width: 560px;
  height: auto;
  transform: translateX(-50%);
  pointer-events: none;
}

.card-stage {
  position: absolute;
  top: 260px;
  left: 0;
  width: 100%;
  height: 1000px;
  overflow: visible;
  touch-action: none;
}

.download-card {
  position: absolute;
  top: 0;
  left: 50%;
  width: 680px;
  height: 685px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  outline: 0;
  transform: translate3d(-50%, 0, 0);
  transform-origin: center 42%;
  will-change: transform, opacity;
  cursor: pointer;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

.download-card.is-active {
  cursor: grab;
}

.download-card.is-active:active {
  cursor: grabbing;
}

.card-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
</style>
