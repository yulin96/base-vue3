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
]

const activeIndex = ref(-1)
const contentRef = ref<HTMLElement>()
const dragOffset = ref(0)
const touchStartY = ref(0)
const isDragging = ref(false)
const activePointerId = ref<number>()
const suppressClickUntil = ref(0)
const wheelLocked = ref(false)
const visualScale = ref(1)
const topZoneHeight = 300
let resizeObserver: ResizeObserver | null = null

const updateVisualScale = () => {
  const width = contentRef.value?.getBoundingClientRect().width || Math.min(window.innerWidth, 750)
  visualScale.value = width / 750
}

const clampIndex = (index: number) => Math.max(0, Math.min(cards.length - 1, index))

const showCard = (index: number) => {
  activeIndex.value = clampIndex(index)
}

const resetCards = () => {
  if (Date.now() < suppressClickUntil.value) return

  activeIndex.value = -1
}

const onCardClick = (index: number) => {
  if (Date.now() < suppressClickUntil.value) return

  if (activeIndex.value === index) {
    infoToast(`点击了${cards[index].title}`)
    return
  }

  showCard(index)
}

const moveCard = (direction: 1 | -1) => {
  if (activeIndex.value === -1) {
    showCard(0)
    return
  }

  showCard(activeIndex.value + direction)
}

const getCardY = (index: number) => {
  if (activeIndex.value === -1) {
    return 430 - topZoneHeight + index * 165
  }

  const firstVisibleBefore = Math.max(activeIndex.value - 2, 0)
  const activeY = 450 - topZoneHeight + (activeIndex.value - firstVisibleBefore) * 185

  if (index <= activeIndex.value) {
    return 450 - topZoneHeight + (index - firstVisibleBefore) * 185
  }

  return activeY + 500 + (index - activeIndex.value - 1) * 165
}

const cardStyles = computed(() =>
  cards.map((_, index) => {
    const isActive = index === activeIndex.value
    const isHidden = activeIndex.value > 1 && index < activeIndex.value - 2
    const drag = isActive ? dragOffset.value : dragOffset.value * 0.18
    const scale = isHidden ? 0.88 : isActive ? 1.04 : 1

    return {
      zIndex: 20 + index,
      opacity: isHidden ? 0 : 1,
      transform: `translate3d(0, ${(getCardY(index) + drag) * visualScale.value}px, 0) scale(${scale})`,
    }
  }),
)

const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  isDragging.value = true
  activePointerId.value = event.pointerId
  touchStartY.value = event.clientY
  dragOffset.value = 0
}

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== activePointerId.value) return

  const deltaY = event.clientY - touchStartY.value
  dragOffset.value = Math.max(-42, Math.min(42, deltaY * 0.22))
}

const onPointerUp = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== activePointerId.value) return

  const deltaY = event.clientY - touchStartY.value
  isDragging.value = false
  activePointerId.value = undefined
  dragOffset.value = 0

  if (Math.abs(deltaY) < 28) return

  suppressClickUntil.value = Date.now() + 220
  moveCard(deltaY < 0 ? 1 : -1)
}

const onPointerCancel = (event: PointerEvent) => {
  if (event.pointerId !== activePointerId.value) return

  isDragging.value = false
  activePointerId.value = undefined
  dragOffset.value = 0
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
              :class="{ 'is-active': index === activeIndex }"
              :style="cardStyles[index]"
              type="button"
              @click.stop="onCardClick(index)"
            >
              <img class="card-img" :alt="card.title" draggable="false" :src="card.image" />
              <img
                class="card-img active-img"
                :class="{ 'is-visible': index === activeIndex }"
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
    filter 680ms cubic-bezier(0.16, 1, 0.3, 1);
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
  filter: drop-shadow(0 -3px 16px rgba(255, 255, 255, 0.3));
  transition:
    opacity 520ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 680ms cubic-bezier(0.16, 1, 0.3, 1);
}

.active-img {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.active-img.is-visible {
  opacity: 1;
}

.nexus-card.is-active .card-img {
  filter: drop-shadow(0 -4px 24px rgba(255, 255, 255, 0.38));
}
</style>
