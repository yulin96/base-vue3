<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import cardWhitePaper from '@/assets/images/download-1.png'
import cardWhitePaperActive from '@/assets/images/download-1s.png'
import cardLivePhotos from '@/assets/images/download-2.png'
import cardLivePhotosActive from '@/assets/images/download-2s.png'
import cardTips from '@/assets/images/download-3.png'
import cardTipsActive from '@/assets/images/download-3s.png'
import cardGuide from '@/assets/images/download-4.png'
import cardGuideActive from '@/assets/images/download-4s.png'
import cardAgenda from '@/assets/images/download-5.png'
import cardAgendaActive from '@/assets/images/download-5s.png'
import cardQuestion from '@/assets/images/download.png'
import cardQuestionActive from '@/assets/images/downloads.png'
import { infoToast } from '@/plugins/vant/toast'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

const cards = [
  { title: 'QUESTION NAIRE', image: cardQuestion, activeImage: cardQuestionActive },
  { title: 'WHITE PAPER', image: cardWhitePaper, activeImage: cardWhitePaperActive },
  { title: 'LIVE PHOTOS', image: cardLivePhotos, activeImage: cardLivePhotosActive },
  { title: 'TIPS', image: cardTips, activeImage: cardTipsActive },
  { title: 'EXHIBITION GUIDE', image: cardGuide, activeImage: cardGuideActive },
  { title: 'AGENDA', image: cardAgenda, activeImage: cardAgendaActive },
  // { title: 'QUESTION NAIRE', image: cardQuestion, activeImage: cardQuestionActive },
  // { title: 'WHITE PAPER', image: cardWhitePaper, activeImage: cardWhitePaperActive },
  // { title: 'LIVE PHOTOS', image: cardLivePhotos, activeImage: cardLivePhotosActive },
  // { title: 'TIPS', image: cardTips, activeImage: cardTipsActive },
  // { title: 'EXHIBITION GUIDE', image: cardGuide, activeImage: cardGuideActive },
  // { title: 'AGENDA', image: cardAgenda, activeImage: cardAgendaActive },
  // { title: 'QUESTION NAIRE', image: cardQuestion, activeImage: cardQuestionActive },
  // { title: 'WHITE PAPER', image: cardWhitePaper, activeImage: cardWhitePaperActive },
  // { title: 'LIVE PHOTOS', image: cardLivePhotos, activeImage: cardLivePhotosActive },
  // { title: 'TIPS', image: cardTips, activeImage: cardTipsActive },
  // { title: 'EXHIBITION GUIDE', image: cardGuide, activeImage: cardGuideActive },
  // { title: 'AGENDA', image: cardAgenda, activeImage: cardAgendaActive },
  // { title: 'QUESTION NAIRE', image: cardQuestion, activeImage: cardQuestionActive },
  // { title: 'WHITE PAPER', image: cardWhitePaper, activeImage: cardWhitePaperActive },
  // { title: 'LIVE PHOTOS', image: cardLivePhotos, activeImage: cardLivePhotosActive },
  // { title: 'TIPS', image: cardTips, activeImage: cardTipsActive },
  // { title: 'EXHIBITION GUIDE', image: cardGuide, activeImage: cardGuideActive },
  // { title: 'AGENDA', image: cardAgenda, activeImage: cardAgendaActive },
]

const activeIndex = ref<number | null>(null)
const contentRef = ref<HTMLElement>()
const visualIndex = ref<number | null>(null)
const touchStartY = ref(0)
const dragStartIndex = ref(0)
const isDragging = ref(false)
const activePointerId = ref<number>()
const suppressClickUntil = ref(0)
const wheelLocked = ref(false)
const visualScale = ref(1)
const topZoneHeight = 300
const cardSwipeStep = 200
const cardInitialTop = 430 - topZoneHeight
const cardInitialGap = 165
const cardActiveTop = 450 - topZoneHeight
const cardBelowActiveGap = 500
const cardBelowGap = 165
const cardFoldGap = 90
const cardFoldMinScale = 0.64
const cardVisibleRadius = 5
let resizeObserver: ResizeObserver | null = null

const updateVisualScale = () => {
  const width = contentRef.value?.getBoundingClientRect().width || Math.min(window.innerWidth, 750)
  visualScale.value = width / 750
}

const showCard = (index: number) => {
  activeIndex.value = index
  visualIndex.value = index
}

const resetCards = () => {
  if (Date.now() < suppressClickUntil.value) return

  activeIndex.value = null
  visualIndex.value = null
}

const onCardClick = (index: number) => {
  if (Date.now() < suppressClickUntil.value) return

  if (activeVisualIndex.value === index) {
    infoToast(`点击了${cards[index].title}`)
    return
  }

  // When clicking a card, we need to know the closest loop index equivalent to target 'index'
  if (activeIndex.value !== null) {
    const N = cards.length
    let distance = (index - activeIndex.value) % N
    if (distance > N / 2) distance -= N
    if (distance < -N / 2) distance += N
    showCard(activeIndex.value + distance)
  } else {
    showCard(index)
  }
}

const moveCard = (direction: 1 | -1) => {
  if (activeIndex.value === null) {
    showCard(0)
    return
  }

  showCard(activeIndex.value + direction)
}

const getRoundedVisualIndex = () => {
  if (visualIndex.value === null) return null

  return Math.round(visualIndex.value)
}

const isCardVisible = (index: number) => {
  const centerIndex = getRoundedVisualIndex()

  if (centerIndex === null) return index < cardVisibleRadius * 2 + 1

  return true // All cards are visible in a loop if N is small, or we can use distance. Let's return true for now and handle distance logic in getCardState
}

const getCardState = (index: number) => {
  if (visualIndex.value === null) {
    return {
      y: cardInitialTop + index * cardInitialGap,
      scale: 1,
      opacity: 1,
      zIndex: 20 + index,
    }
  }

  const N = cards.length
  let distance = (index - visualIndex.value) % N
  if (distance > N / 2) distance -= N
  if (distance < -N / 2) distance += N

  if (distance <= 0) {
    const foldDistance = Math.abs(distance)
    return {
      y: cardActiveTop - foldDistance * cardFoldGap,
      scale: Math.max(cardFoldMinScale, 1.04 - foldDistance * 0.09),
      opacity: Math.max(0.42, 1 - foldDistance * 0.1),
      zIndex: 20 + Math.round(distance * 10),
    }
  }

  const firstBelowProgress = Math.min(distance, 1)
  const y = cardActiveTop + firstBelowProgress * cardBelowActiveGap + Math.max(distance - 1, 0) * cardBelowGap

  return {
    y,
    scale: 1 + (1 - firstBelowProgress) * 0.04,
    opacity: 1,
    zIndex: 20 + Math.round(distance * 10),
  }
}

const cardStyles = computed(() =>
  cards.map((_, index) => {
    const isVisible = isCardVisible(index)
    const state = getCardState(index)
    // disable transition when wrapping to prevent flying across screen
    const N = cards.length
    let rawDist = (index - (visualIndex.value || 0)) % N
    if (rawDist > N / 2) rawDist -= N
    if (rawDist < -N / 2) rawDist += N

    // threshold slightly less than N/2
    const isWrapping = Math.abs(rawDist) >= N / 2 - 0.1

    return {
      zIndex: state.zIndex,
      opacity: isVisible ? state.opacity : 0,
      visibility: isVisible ? ('visible' as const) : ('hidden' as const),
      pointerEvents: isVisible ? ('auto' as const) : ('none' as const),
      transform: `translate3d(0, ${state.y * visualScale.value}px, 0) scale(${state.scale})`,
      transitionDuration: isDragging.value || isWrapping ? '0ms' : '',
    }
  }),
)

const activeVisualIndex = computed(() => {
  const index = getRoundedVisualIndex()
  if (index === null) return null
  return ((index % cards.length) + cards.length) % cards.length
})

const getActiveImageOpacity = (index: number) => {
  if (visualIndex.value === null || !isCardVisible(index)) return 0

  const N = cards.length
  let distance = (index - visualIndex.value) % N
  if (distance > N / 2) distance -= N
  if (distance < -N / 2) distance += N

  return Math.max(0, 1 - Math.abs(distance) * 2)
}

const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  isDragging.value = true
  activePointerId.value = event.pointerId
  touchStartY.value = event.clientY
  dragStartIndex.value = visualIndex.value === null ? 0 : visualIndex.value
}

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== activePointerId.value) return

  const deltaY = (event.clientY - touchStartY.value) / visualScale.value
  visualIndex.value = dragStartIndex.value - deltaY / cardSwipeStep
}

const onPointerUp = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== activePointerId.value) return

  const deltaY = (event.clientY - touchStartY.value) / visualScale.value
  isDragging.value = false
  activePointerId.value = undefined

  if (Math.abs(deltaY) < 8 || visualIndex.value === null) {
    visualIndex.value = activeIndex.value
    return
  }

  const nextIndex = Math.round(visualIndex.value)
  suppressClickUntil.value = Date.now() + 220
  showCard(nextIndex)
}

const onPointerCancel = (event: PointerEvent) => {
  if (event.pointerId !== activePointerId.value) return

  isDragging.value = false
  activePointerId.value = undefined
  visualIndex.value = activeIndex.value
}

const onWheel = (event: WheelEvent) => {
  event.preventDefault()

  if (wheelLocked.value || Math.abs(event.deltaY) < 8) return

  wheelLocked.value = true
  moveCard(event.deltaY > 0 ? 1 : -1)

  window.setTimeout(() => {
    wheelLocked.value = false
  }, 640)
}

onMounted(() => {
  updateVisualScale()
  if (contentRef.value) {
    resizeObserver = new ResizeObserver(updateVisualScale)
    resizeObserver.observe(contentRef.value)
  }
  window.addEventListener('resize', updateVisualScale)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateVisualScale)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
})
</script>

<template>
  <div class="size-full">
    <section
      class="scroll-box index"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointercancel="onPointerCancel"
      @pointerup="onPointerUp"
      @wheel="onWheel"
    >
      <main ref="contentRef" class="content">
        <div class="top-zone center" @click="resetCards">
          <img class="h-180" src="../assets/images/kv.png" />
        </div>

        <div class="bottom-zone" @click="resetCards">
          <div class="card-stage" :class="{ 'is-dragging': isDragging }">
            <button
              v-for="(card, index) in cards"
              :key="card.title"
              class="nexus-card"
              :class="{ 'is-active': index === activeVisualIndex }"
              :style="cardStyles[index]"
              type="button"
              @click.stop="onCardClick(index)"
            >
              <img class="card-img" :alt="card.title" draggable="false" :src="card.image" />
              <img
                class="card-img active-img"
                :style="{ opacity: getActiveImageOpacity(index) }"
                :alt="`${card.title}展开`"
                draggable="false"
                :src="card.activeImage"
              />
            </button>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<style scoped>
.index {
  overflow: hidden;
  background: #020202;
  color: #fff;
  touch-action: none;
  user-select: none;
}

.content {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
}

.top-zone {
  position: relative;
  z-index: 80;
  height: 300px;
  flex: 0 0 auto;
}

.brand {
  position: relative;
  padding-top: 92px;
  text-align: center;
  pointer-events: none;
}

.brand-main {
  display: inline-block;
  font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
  font-size: 78px;
  font-weight: 900;
  line-height: 0.78;
  letter-spacing: 0;
  text-align: left;
  transform: skewX(-3deg);
}

.brand-side {
  position: absolute;
  top: 104px;
  right: 108px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
  font-size: 24px;
  line-height: 0.92;
  text-align: left;
}

.brand-side span {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: #ff3047;
  font-family: sans-serif;
  font-size: 18px;
  font-weight: 700;
}

.brand-side strong {
  font-size: 25px;
  letter-spacing: 0;
}

.brand p {
  margin-top: 12px;
  font-size: 20px;
  line-height: 1;
  letter-spacing: 10px;
  opacity: 0.86;
}

.bottom-zone {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.card-stage {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
}

.nexus-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  outline: none;
  transform-origin: 50% 18%;
  transition:
    transform 680ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 460ms ease,
    visibility 460ms ease;
  will-change: transform;
  -webkit-tap-highlight-color: transparent;
}

.card-stage.is-dragging .nexus-card {
  transition-duration: 0ms;
}

.card-img {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  transition: opacity 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.active-img {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.active-img.is-visible {
  opacity: 1;
}
</style>
