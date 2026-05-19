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

interface CardInstance {
  uid: number
  cardId: number
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

let cardUid = 0
let nextCardId = 5
const createCardInstance = (cardId = nextCardId): CardInstance => {
  nextCardId = (cardId - 1 + cards.length) % cards.length
  return {
    uid: cardUid++,
    cardId,
  }
}

const stackCards = ref([5, 4, 3, 2, 1, 0].map((cardId) => createCardInstance(cardId)))
const cardElements = reactive(new Map<number, HTMLElement>())
const activeId = computed(() => stackCards.value[0]?.uid)
const isAnimating = ref(false)
const dragState = ref<DragState | null>(null)
const layoutRatio = ref(0.5)

const stackLayout = [
  { y: 740, scale: 1.12, rotate: 0, opacity: 1 },
  { y: 548, scale: 0.98, rotate: 0, opacity: 1 },
  { y: 396, scale: 0.91, rotate: 0, opacity: 1 },
  { y: 254, scale: 0.85, rotate: 0, opacity: 1 },
  { y: 118, scale: 0.79, rotate: 0, opacity: 1 },
  { y: 52, scale: 0.73, rotate: 0, opacity: 0 },
]

const toScreen = (value: number) => value * layoutRatio.value
const getCardItem = (cardId: number) => cards.find((item) => item.id === cardId)!

const getFlowLayout = (position: number) => {
  if (position >= 0 && position < stackLayout.length) return stackLayout[position]

  if (position < 0) {
    const step = -position
    const yStep = stackLayout[0].y - stackLayout[1].y
    const scaleStep = stackLayout[0].scale - stackLayout[1].scale

    return {
      y: stackLayout[0].y + yStep * step,
      scale: stackLayout[0].scale + scaleStep * step,
      rotate: 0,
      opacity: 0,
    }
  }

  const step = position - (stackLayout.length - 1)
  const yStep = stackLayout[stackLayout.length - 2].y - stackLayout[stackLayout.length - 1].y
  const scaleStep = stackLayout[stackLayout.length - 2].scale - stackLayout[stackLayout.length - 1].scale

  return {
    y: stackLayout[stackLayout.length - 1].y - yStep * step,
    scale: Math.max(0.56, stackLayout[stackLayout.length - 1].scale - scaleStep * step),
    rotate: 0,
    opacity: 0,
  }
}

const applyLayout = (
  element: HTMLElement,
  position: number,
  options: gsap.TweenVars = {},
) => {
  const layout = getFlowLayout(position)

  return gsap.to(element, {
    xPercent: -50,
    x: 0,
    y: toScreen(layout.y),
    scale: layout.scale,
    rotate: layout.rotate,
    opacity: layout.opacity,
    zIndex: cards.length - position,
    ...options,
  })
}

const displayCards = computed(() =>
  stackCards.value
    .map((instance, position) => {
      const card = getCardItem(instance.cardId)
      return {
        ...card,
        uid: instance.uid,
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

const getCardPosition = (id: number) => stackCards.value.findIndex((card) => card.uid === id)

const createCardGhost = (element: HTMLElement) => {
  const parent = element.parentElement
  if (!parent) return null

  const ghost = element.cloneNode(true) as HTMLElement
  ghost.setAttribute('aria-hidden', 'true')
  ghost.style.pointerEvents = 'none'
  parent.appendChild(ghost)

  gsap.set(ghost, {
    xPercent: -50,
    x: gsap.getProperty(element, 'x'),
    y: gsap.getProperty(element, 'y'),
    scale: gsap.getProperty(element, 'scale'),
    rotate: gsap.getProperty(element, 'rotate'),
    opacity: gsap.getProperty(element, 'opacity'),
    zIndex: gsap.getProperty(element, 'zIndex'),
  })

  return ghost
}

const removeCardGhost = (ghost: HTMLElement) => {
  if (!ghost.isConnected) return
  ghost.remove()
}

const animateStack = async (immediate = false, duration = 0.66, ease = 'elastic.out(0.82, 0.62)') => {
  await nextTick()

  return new Promise<void>((resolve) => {
    const visibleCards = stackCards.value
      .map((card, position) => ({ card, position, element: cardElements.get(card.uid) }))
      .filter((item): item is { card: CardInstance; position: number; element: HTMLElement } => Boolean(item.element))

    if (!visibleCards.length) {
      resolve()
      return
    }

    let pending = visibleCards.length
    const done = () => {
      pending -= 1
      if (pending <= 0) resolve()
    }

    visibleCards.forEach(({ element, position }) => {
      applyLayout(element, position, {
        duration: immediate ? 0 : duration,
        ease: immediate ? 'none' : ease,
        overwrite: true,
        onComplete: done,
        onInterrupt: done,
      })
    })
  })
}

const activateCard = async (id: number) => {
  const position = getCardPosition(id)
  if (position <= 0 || isAnimating.value) return

  isAnimating.value = true
  const currentCards = [...stackCards.value]
  const outgoingCards = currentCards.slice(0, position)
  const survivorCards = currentCards.slice(position)
  const incomingCards = Array.from({ length: position }, () => createCardInstance())
  const nextCards = [...survivorCards, ...incomingCards]
  const outgoingGhosts = outgoingCards
    .map((card, oldPosition) => {
      const element = cardElements.get(card.uid)
      if (!element) return null
      const ghost = createCardGhost(element)
      if (ghost) {
        gsap.set(ghost, {
          xPercent: -50,
          x: 0,
          transformOrigin: 'center 42%',
          zIndex: cards.length + position - oldPosition,
        })
      }
      return ghost ? { ghost, oldPosition } : null
    })
    .filter((item): item is { ghost: HTMLElement; oldPosition: number } => Boolean(item))

  cardElements.forEach((element) => gsap.killTweensOf(element))
  stackCards.value = nextCards
  await nextTick()

  const timeline = gsap.timeline({
    defaults: { duration: 0.92, ease: 'power3.inOut' },
    onComplete: () => {
      outgoingGhosts.forEach(({ ghost }) => removeCardGhost(ghost))
      isAnimating.value = false
    },
    onInterrupt: () => {
      outgoingGhosts.forEach(({ ghost }) => removeCardGhost(ghost))
      isAnimating.value = false
    },
  })

  outgoingGhosts.forEach(({ ghost, oldPosition }) => {
    timeline.add(applyLayout(ghost, oldPosition - position, { overwrite: true }), 0)
  })

  nextCards.forEach((card, nextPosition) => {
    const element = cardElements.get(card.uid)
    if (!element) return

    if (incomingCards.includes(card)) {
      const startLayout = getFlowLayout(nextPosition + position)
      gsap.set(element, {
        xPercent: -50,
        x: 0,
        y: toScreen(startLayout.y),
        scale: startLayout.scale,
        rotate: startLayout.rotate,
        opacity: startLayout.opacity,
        zIndex: cards.length - nextPosition,
      })
    }

    timeline.add(applyLayout(element, nextPosition, { overwrite: true }), 0)
  })

  timeline.play()
}

const flyActiveCard = async (offsetX: number, offsetY: number) => {
  const currentId = activeId.value
  const element = cardElements.get(currentId)
  if (!element || isAnimating.value) return

  isAnimating.value = true
  const currentCards = [...stackCards.value]
  const nextCards = [...currentCards.slice(1), createCardInstance()]
  const distance = Math.hypot(offsetX, offsetY) || 1
  const directionX = offsetX / distance
  const directionY = offsetY / distance
  const flyDistance = toScreen(1100)
  const ghost = createCardGhost(element)

  gsap.killTweensOf(element)
  stackCards.value = nextCards
  await nextTick()

  if (ghost) {
    gsap.to(ghost, {
      xPercent: -50,
      x: directionX * flyDistance,
      y: toScreen(stackLayout[0].y) + directionY * flyDistance,
      rotate: directionX * 18,
      scale: 0.8,
      opacity: 0,
      duration: 0.36,
      ease: 'power3.out',
      overwrite: true,
      onComplete: () => removeCardGhost(ghost),
    })
    window.setTimeout(() => removeCardGhost(ghost), 440)
  }

  const incomingCard = nextCards[nextCards.length - 1]
  const incomingElement = cardElements.get(incomingCard.uid)
  if (incomingElement) {
    const startLayout = getFlowLayout(stackLayout.length)
    gsap.set(incomingElement, {
      xPercent: -50,
      x: 0,
      y: toScreen(startLayout.y),
      scale: startLayout.scale,
      rotate: startLayout.rotate,
      opacity: startLayout.opacity,
      zIndex: 1,
    })
  }

  await animateStack(false, 0.56, 'power3.out')
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
          <div
            v-for="card in displayCards"
            :key="card.uid"
            :ref="(element) => setCardElement(card.uid, element)"
            class="download-card"
            :class="{ 'is-active': card.position === 0 }"
            role="button"
            tabindex="0"
            :style="{ zIndex: cards.length - card.position }"
            @click="onCardClick(card.uid, card.position)"
            @pointerdown="onPointerDown($event, card.uid, card.position)"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <img class="card-image" :src="card.image" alt="" draggable="false" />
          </div>
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
