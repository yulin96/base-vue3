<script setup lang="ts">
import { useGsapContext } from '@/hooks/useGsapContext'
import gsap from 'gsap'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

type ArtType = 'sun' | 'slice' | 'bars' | 'beam' | 'halo' | 'wave'

type CardItem = {
  eyebrow: string
  title: string
  host: string
  start: string
  end: string
  accent: string
  ink: string
  art: ArtType
}

const cards: CardItem[] = [
  {
    eyebrow: 'Brief',
    title: 'Soft Pulse',
    host: 'Mina Hollow',
    start: '#ffbbdd',
    end: '#ffd1f6',
    accent: '#fff4ff',
    ink: '#432348',
    art: 'halo',
  },
  {
    eyebrow: 'Brief',
    title: 'Insight Pod',
    host: 'Arlo Gardner',
    start: '#f8ff75',
    end: '#ffd972',
    accent: '#fff8b3',
    ink: '#433000',
    art: 'sun',
  },
  {
    eyebrow: 'Short',
    title: 'Chat Wisdom',
    host: 'Leslie McElroy',
    start: '#c67cff',
    end: '#8755ff',
    accent: '#ffd6ff',
    ink: '#1e1334',
    art: 'slice',
  },
  {
    eyebrow: 'Short',
    title: 'Wisdom Talks',
    host: 'Bessie Alvarado',
    start: '#dbffb6',
    end: '#9bf0bd',
    accent: '#f6ffae',
    ink: '#24422f',
    art: 'bars',
  },
  {
    eyebrow: 'Brief',
    title: 'Glow Cast',
    host: 'Noah Hale',
    start: '#e4ff1a',
    end: '#b6ff34',
    accent: '#faff91',
    ink: '#314106',
    art: 'beam',
  },
  {
    eyebrow: 'Brief',
    title: 'Blue Signal',
    host: 'Rhea Bloom',
    start: '#a4f8ff',
    end: '#72d6ff',
    accent: '#ebffff',
    ink: '#163954',
    art: 'wave',
  },
  {
    eyebrow: 'Short',
    title: 'Velvet Notes',
    host: 'Luca Vale',
    start: '#ffc6ae',
    end: '#ff9ab7',
    accent: '#ffe1d8',
    ink: '#522540',
    art: 'sun',
  },
  {
    eyebrow: 'Brief',
    title: 'Night Current',
    host: 'Iris Kline',
    start: '#7ac2ff',
    end: '#5c70ff',
    accent: '#cce0ff',
    ink: '#101f48',
    art: 'halo',
  },
]

const cardCount = cards.length

const orbRef = ref<HTMLElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const viewportWidth = ref(390)
const dragMode = ref<'idle' | 'carousel' | 'orb'>('idle')
const activePointerId = ref<number | null>(null)
const orbActive = ref(false)
const startX = ref(0)
const startRotation = ref(0)
const lastOrbAngle = ref(0)
const startOrbTurn = ref(0)
const dragTarget = ref<HTMLElement | null>(null)
let dragFrame = 0
let frameResizeObserver: ResizeObserver | null = null
const pendingMotion = {
  rotation: 2,
  orbTurn: 0,
}

const motion = reactive({
  rotation: 2,
  carouselScale: 1,
  orbGlow: 0.24,
  expansion: 0,
  orbTurn: 0,
})

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount

const trackMetrics = computed(() => {
  const stageWidth = viewportWidth.value
  const expand = motion.expansion

  return {
    radiusX: mix(stageWidth * 0.46, stageWidth * 0.68, expand),
    radiusY: mix(stageWidth * 0.12, stageWidth * 0.25, expand),
    dragDistance: mix(Math.max(stageWidth * 0.22, 92), Math.max(stageWidth * 0.3, 116), expand),
    slotAngle: mix(20.5, 13.4, expand),
    visibleRange: mix(1.38, 3.55, expand),
    fadeRange: mix(0.34, 1.46, expand),
    scaleBase: mix(0.88, 0.82, expand),
    scaleBoost: mix(0.2, 0.22, expand),
    rotateFactor: mix(1.06, 0.92, expand),
  }
})

const currentIndex = computed(() => wrapIndex(Math.round(motion.rotation), cardCount))

const orbStyle = computed(() => ({
  '--orb-turn-angle': `${motion.orbTurn}deg`,
  '--orb-progress-angle': `${motion.orbTurn}deg`,
  '--orb-bloom': `${motion.orbGlow}`,
}))

const wrapIndex = (value: number, size: number) => ((value % size) + size) % size

const normalizeSlotOffset = (value: number, size: number) => {
  let wrapped = wrapIndex(value + size / 2, size) - size / 2

  if (wrapped <= -size / 2) wrapped += size

  return wrapped
}

const normalizeAngleDelta = (delta: number) => {
  let next = delta

  if (next > 180) next -= 360
  if (next < -180) next += 360

  return next
}

const updateViewportWidth = () => {
  viewportWidth.value =
    frameRef.value?.clientWidth ||
    (document.querySelector('#app') as HTMLDivElement | null)?.clientWidth ||
    window.innerWidth
}

const flushDragMotion = () => {
  dragFrame = 0
  motion.rotation = pendingMotion.rotation
  motion.orbTurn = pendingMotion.orbTurn
}

const queueDragMotion = (next: { rotation?: number; orbTurn?: number }) => {
  if (typeof next.rotation === 'number') pendingMotion.rotation = next.rotation
  if (typeof next.orbTurn === 'number') pendingMotion.orbTurn = next.orbTurn

  if (dragFrame) return

  dragFrame = requestAnimationFrame(flushDragMotion)
}

const flushPendingDragMotion = () => {
  if (!dragFrame) return

  cancelAnimationFrame(dragFrame)
  flushDragMotion()
}

const setOrbActive = (active: boolean) => {
  if (orbActive.value === active) return

  orbActive.value = active
  gsap.killTweensOf(motion, 'carouselScale,orbGlow,expansion')
  gsap.to(motion, {
    carouselScale: active ? 0.82 : 1,
    orbGlow: active ? 1 : 0.24,
    expansion: active ? 1 : 0,
    duration: active ? 0.32 : 0.44,
    ease: active ? 'power3.out' : 'expo.out',
  })
}

const getOrbAngle = (event: PointerEvent) => {
  const rect = orbRef.value?.getBoundingClientRect()

  if (!rect) return 0

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const angle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI

  return wrapIndex(angle + 90, 360)
}

const snapRotation = (syncOrb = false) => {
  const snappedRotation = Math.round(motion.rotation)

  gsap.killTweensOf(motion, 'rotation')
  const tweenState: {
    rotation: number
    duration: number
    ease: string
    orbTurn?: number
  } = {
    rotation: snappedRotation,
    duration: 0.68,
    ease: 'elastic.out(1, 0.78)',
  }

  if (syncOrb) {
    tweenState.orbTurn = gsap.utils.clamp(
      0,
      360,
      motion.orbTurn + (snappedRotation - motion.rotation) * (360 / cardCount),
    )
  }

  gsap.to(motion, tweenState)
}

const startCarouselDrag = (event: PointerEvent) => {
  if (dragMode.value !== 'idle' || orbActive.value) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  event.preventDefault()
  activePointerId.value = event.pointerId
  dragMode.value = 'carousel'
  dragTarget.value = event.currentTarget as HTMLElement
  startX.value = event.clientX
  startRotation.value = motion.rotation
  pendingMotion.rotation = motion.rotation
  pendingMotion.orbTurn = motion.orbTurn
  dragTarget.value?.setPointerCapture?.(event.pointerId)
  gsap.killTweensOf(motion, 'rotation')
}

const startOrbDrag = (event: PointerEvent) => {
  if (dragMode.value !== 'idle') return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  event.preventDefault()
  activePointerId.value = event.pointerId
  dragMode.value = 'orb'
  dragTarget.value = event.currentTarget as HTMLElement
  startRotation.value = motion.rotation
  startOrbTurn.value = motion.orbTurn
  lastOrbAngle.value = getOrbAngle(event)
  pendingMotion.rotation = motion.rotation
  pendingMotion.orbTurn = motion.orbTurn
  dragTarget.value?.setPointerCapture?.(event.pointerId)
  gsap.killTweensOf(motion, 'rotation,orbTurn')
  setOrbActive(true)
}

const handlePointerMove = (event: PointerEvent) => {
  if (activePointerId.value !== event.pointerId) return

  if (dragMode.value === 'carousel') {
    event.preventDefault()
    const deltaX = event.clientX - startX.value

    queueDragMotion({
      rotation: startRotation.value - deltaX / trackMetrics.value.dragDistance,
    })
  }

  if (dragMode.value === 'orb') {
    event.preventDefault()
    const nextAngle = getOrbAngle(event)
    const delta = normalizeAngleDelta(nextAngle - lastOrbAngle.value)

    lastOrbAngle.value = nextAngle
    const nextTurn = gsap.utils.clamp(0, 360, pendingMotion.orbTurn + delta)

    queueDragMotion({
      orbTurn: nextTurn,
      rotation: startRotation.value + (nextTurn - startOrbTurn.value) / (360 / cardCount),
    })
  }
}

const finishDrag = (event?: PointerEvent) => {
  if (event && activePointerId.value !== event.pointerId) return
  if (dragMode.value === 'idle') return

  const wasOrb = dragMode.value === 'orb'
  const pointerId = activePointerId.value

  flushPendingDragMotion()
  if (pointerId !== null) dragTarget.value?.releasePointerCapture?.(pointerId)

  activePointerId.value = null
  dragMode.value = 'idle'
  dragTarget.value = null

  if (wasOrb) setOrbActive(false)
  snapRotation(wasOrb)
}

const getCardStyle = (index: number) => {
  const metrics = trackMetrics.value
  const slot = normalizeSlotOffset(index - motion.rotation, cardCount)
  const absSlot = Math.abs(slot)
  const angle = slot * metrics.slotAngle
  const rad = (angle * Math.PI) / 180
  const depth = Math.max(0, 1 - absSlot / (metrics.visibleRange + 1.62))
  const visibility = Math.max(0, 1 - Math.max(0, absSlot - metrics.visibleRange) / metrics.fadeRange)
  const x = Math.sin(rad) * metrics.radiusX
  const y = (1 - Math.cos(rad)) * metrics.radiusY
  const scale = (metrics.scaleBase + depth * metrics.scaleBoost) * motion.carouselScale
  const opacity = (0.08 + depth * 0.92) * visibility
  const zIndex = Math.round(20 + depth * 100)
  const brightness = 0.74 + depth * 0.4
  const saturation = 0.76 + depth * 0.5

  return {
    transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle * metrics.rotateFactor}deg) scale(${scale})`,
    opacity,
    zIndex,
    filter: `brightness(${brightness}) saturate(${saturation})`,
  }
}

useGsapContext('.orbital-page', () => {
  gsap.fromTo(
    motion,
    { rotation: 2.35, carouselScale: 0.92 },
    { rotation: 2, carouselScale: 1, duration: 1.15, ease: 'expo.out', delay: 0.06 },
  )
  gsap.from('.hero-frame', { y: 36, opacity: 0, duration: 0.92, ease: 'power3.out' })
  gsap.from('.carousel-card', {
    opacity: 0,
    duration: 0.72,
    stagger: 0.05,
    delay: 0.14,
    ease: 'power2.out',
  })
  gsap.from('.orb-shell', {
    y: 54,
    scale: 0.86,
    opacity: 0,
    duration: 1.1,
    delay: 0.16,
    ease: 'elastic.out(1, 0.7)',
  })
  gsap.from('.scene-halo', {
    scale: 0.84,
    opacity: 0,
    duration: 1.2,
    stagger: 0.08,
    ease: 'power2.out',
  })
})

onMounted(() => {
  updateViewportWidth()
  frameResizeObserver = new ResizeObserver(updateViewportWidth)
  if (frameRef.value) frameResizeObserver.observe(frameRef.value)
  window.addEventListener('resize', updateViewportWidth)
  window.addEventListener('pointermove', handlePointerMove, { passive: false })
  window.addEventListener('pointerup', finishDrag)
  window.addEventListener('pointercancel', finishDrag)
})

onBeforeUnmount(() => {
  flushPendingDragMotion()
  frameResizeObserver?.disconnect()
  frameResizeObserver = null
  window.removeEventListener('resize', updateViewportWidth)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', finishDrag)
  window.removeEventListener('pointercancel', finishDrag)
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index orbital-page">
      <main class="content orbital-layout">
        <div class="scene-halo halo-left"></div>
        <div class="scene-halo halo-right"></div>
        <div class="scene-grid"></div>

        <div ref="frameRef" class="hero-frame">
          <div
            class="carousel-shell"
            :class="{ 'is-dragging': dragMode === 'carousel' }"
            @pointerdown="startCarouselDrag"
          >
            <div class="arc-wash"></div>
            <article
              v-for="(card, index) in cards"
              :key="`${card.title}-${card.host}`"
              class="carousel-card"
              :class="[card.art, { 'is-current': currentIndex === index }]"
              :style="[
                getCardStyle(index),
                {
                  '--card-start': card.start,
                  '--card-end': card.end,
                  '--card-accent': card.accent,
                  '--card-ink': card.ink,
                },
              ]"
            >
              <div class="card-sheen"></div>
              <div class="card-copy">
                <p class="card-kicker">{{ card.eyebrow }}</p>
                <h2 class="card-title">{{ card.title }}</h2>
              </div>
              <div class="card-art">
                <span class="card-core"></span>
                <span class="card-echo"></span>
              </div>
              <p class="card-host">{{ card.host }}</p>
            </article>
          </div>

          <div class="orb-shell">
            <button
              ref="orbRef"
              type="button"
              class="control-orb"
              :class="{ 'is-active': orbActive, 'is-dragging': dragMode === 'orb' }"
              :style="orbStyle"
              aria-label="Rotate cards"
              @pointerdown="startOrbDrag"
            >
              <span class="orb-aura"></span>
              <span class="orb-body"></span>
              <span class="orb-track"></span>
              <span class="orb-progress"></span>
              <span class="orb-handle"></span>
            </button>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<route lang="json">
{ "meta": { "index": 10 } }
</route>

<style scoped>
.orbital-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  white-space: normal;
  background:
    radial-gradient(circle at 50% 74%, rgb(69 127 255 / 22%), transparent 34%),
    radial-gradient(circle at 50% 14%, rgb(172 114 255 / 16%), transparent 32%),
    linear-gradient(180deg, #112848 0%, #081525 54%, #06111c 100%);
}

.hero-frame {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100vh;
  width: 100%;
  margin: 0 auto;
  flex-direction: column;
  justify-content: space-between;
  padding: 88px 0 72px;
}

.scene-halo,
.scene-grid,
.arc-wash {
  pointer-events: none;
}

.scene-halo {
  position: absolute;
  border-radius: 999px;
  filter: blur(8px);
}

.halo-left {
  top: 15%;
  left: -18%;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgb(255 172 225 / 22%), transparent 70%);
}

.halo-right {
  right: -22%;
  bottom: 11%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgb(110 170 255 / 24%), transparent 68%);
}

.scene-grid {
  position: absolute;
  inset: 0;
  opacity: 0.26;
  background:
    linear-gradient(rgb(255 255 255 / 4%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 4%) 1px, transparent 1px);
  background-size: 100% 64px, 64px 100%;
  mask-image: linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 75%) 20%, #000 100%);
}

.carousel-shell {
  position: relative;
  height: 56vh;
  min-height: 430px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.carousel-shell.is-dragging {
  cursor: grabbing;
}

.arc-wash {
  position: absolute;
  inset: 13% 2% auto;
  height: 52%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 84%, rgb(255 255 255 / 10%), transparent 40%),
    radial-gradient(circle at 50% 100%, rgb(0 194 255 / 18%), transparent 58%);
  filter: blur(12px);
}

.carousel-card {
  position: absolute;
  top: clamp(324px, 38vh, 362px);
  left: 50%;
  width: clamp(186px, 47vw, 236px);
  height: clamp(266px, 69vw, 340px);
  overflow: hidden;
  border-radius: 27px;
  padding: 18px 16px 15px;
  color: var(--card-ink);
  background:
    linear-gradient(155deg, var(--card-start) 0%, var(--card-end) 100%);
  box-shadow:
    0 30px 60px rgb(0 0 0 / 18%),
    inset 0 1px 0 rgb(255 255 255 / 45%),
    inset 0 0 0 1px rgb(255 255 255 / 14%);
  transform-origin: 50% 152%;
  will-change: transform, opacity, filter;
  pointer-events: none;
  transition:
    box-shadow 260ms ease,
    filter 260ms ease;
}

.carousel-card.is-current {
  box-shadow:
    0 36px 72px rgb(0 0 0 / 22%),
    0 0 48px color-mix(in srgb, var(--card-accent) 42%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 52%),
    inset 0 0 0 1px rgb(255 255 255 / 18%);
}

.card-sheen {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgb(255 255 255 / 28%), transparent 28%, transparent 72%, rgb(255 255 255 / 18%));
  mix-blend-mode: screen;
  opacity: 0.52;
}

.card-copy,
.card-host,
.card-art {
  position: relative;
  z-index: 1;
}

.card-copy {
  display: grid;
  gap: 5px;
}

.card-kicker {
  font-size: clamp(18px, 4.2vw, 22px);
  font-weight: 800;
  line-height: 1;
}

.card-title {
  max-width: 92%;
  font-size: clamp(20px, 5.2vw, 29px);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.04em;
  opacity: 0.48;
}

.card-art {
  position: relative;
  margin-top: 20px;
  height: calc(100% - 98px);
}

.card-core,
.card-echo {
  position: absolute;
  inset: 50% auto auto 50%;
  display: block;
  transform: translate(-50%, -50%);
}

.sun .card-core {
  width: 68%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, var(--card-accent) 0%, rgb(255 215 54 / 90%) 56%, transparent 74%);
  filter: blur(6px);
}

.sun .card-echo {
  width: 82%;
  height: 42%;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 50%, rgb(255 245 170 / 58%), transparent 72%);
  filter: blur(16px);
}

.slice .card-core {
  width: 64%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgb(255 214 255 / 64%);
}

.slice .card-echo {
  width: 26%;
  height: 92%;
  border-radius: 18px;
  background: linear-gradient(180deg, rgb(255 214 255 / 0%) 0%, rgb(255 214 255 / 78%) 38%, rgb(255 214 255 / 0%) 100%);
  transform: translate(-50%, -50%) rotate(16deg);
}

.bars .card-core {
  width: 84%;
  height: 74%;
  border-radius: 24px;
  background:
    repeating-linear-gradient(
      90deg,
      rgb(250 255 190 / 0%) 0 18px,
      rgb(250 255 190 / 56%) 18px 34px,
      rgb(250 255 190 / 0%) 34px 54px
    );
  filter: blur(6px);
}

.bars .card-echo {
  width: 92%;
  height: 90%;
  border-radius: 32px;
  background: radial-gradient(circle at 50% 50%, rgb(255 255 255 / 12%), transparent 62%);
}

.beam .card-core {
  width: 92%;
  height: 34%;
  border-radius: 999px;
  background: linear-gradient(135deg, rgb(255 255 255 / 92%), rgb(255 255 255 / 0%));
  filter: blur(7px);
  transform: translate(-50%, -50%) rotate(-22deg);
}

.beam .card-echo {
  width: 86%;
  height: 70%;
  border-radius: 28px;
  background: radial-gradient(circle at 64% 42%, rgb(255 255 255 / 24%), transparent 62%);
}

.halo .card-core {
  width: 76%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgb(255 255 255 / 0%) 0 26%, rgb(255 236 255 / 72%) 26% 39%, transparent 39% 54%, rgb(255 255 255 / 36%) 54% 60%, transparent 60%);
}

.halo .card-echo {
  width: 98%;
  height: 80%;
  border-radius: 34px;
  background: radial-gradient(circle, rgb(255 255 255 / 22%) 0%, transparent 68%);
}

.wave .card-core {
  width: 88%;
  height: 44%;
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, rgb(236 255 255 / 86%) 45%, rgb(255 255 255 / 0%) 100%);
  filter: blur(6px);
}

.wave .card-echo {
  width: 96%;
  height: 72%;
  border-radius: 40px;
  background: radial-gradient(circle at 50% 64%, rgb(255 255 255 / 16%), transparent 68%);
}

.card-host {
  position: absolute;
  right: 16px;
  bottom: 14px;
  left: 16px;
  font-size: clamp(14px, 3.5vw, 18px);
  line-height: 1;
  opacity: 0.54;
}

.orb-shell {
  display: flex;
  justify-content: center;
  padding-bottom: 12px;
  touch-action: none;
}

.control-orb {
  --orb-size: clamp(136px, 34vw, 176px);
  position: relative;
  width: var(--orb-size);
  aspect-ratio: 1;
  border: 0;
  padding: 0;
  border-radius: 50%;
  background: none;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
}

.orb-aura,
.orb-body,
.orb-track,
.orb-progress,
.orb-handle {
  position: absolute;
  inset: 0;
  display: block;
  border-radius: 50%;
}

.orb-aura {
  background:
    radial-gradient(circle at 50% 50%, rgb(115 173 255 / 26%), transparent 60%);
  transform: scale(1.46);
  opacity: calc(0.35 + var(--orb-bloom) * 0.35);
  filter: blur(18px);
  will-change: transform, opacity;
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.orb-body {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 36%),
    inset 0 0 0 1px rgb(255 255 255 / 10%),
    0 30px 70px rgb(0 0 0 / 24%);
  background: linear-gradient(180deg, rgb(255 255 255 / 22%), rgb(255 255 255 / 10%));
  backdrop-filter: blur(22px) saturate(1.2);
  will-change: transform, opacity;
  transition:
    transform 280ms ease,
    background 280ms ease,
    box-shadow 280ms ease,
    filter 280ms ease;
}

.orb-track {
  inset: -16px;
  opacity: 0;
  border: 4px solid rgb(255 255 255 / 34%);
  box-shadow: 0 0 14px rgb(255 255 255 / 6%);
  will-change: transform, opacity;
  transition:
    opacity 220ms ease,
    transform 220ms ease;
  transform: scale(0.92);
}

.orb-progress {
  inset: -16px;
  opacity: 0;
  background:
    conic-gradient(
      from 0deg,
      rgb(255 255 255 / 98%) 0deg,
      rgb(255 255 255 / 98%) var(--orb-progress-angle),
      transparent var(--orb-progress-angle),
      transparent 360deg
    );
  mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
  box-shadow: 0 0 18px rgb(255 255 255 / 18%);
  will-change: transform, opacity;
  transition:
    opacity 220ms ease,
    transform 220ms ease;
  transform: scale(0.92);
}

.orb-handle {
  inset: 50% auto auto 50%;
  width: calc(var(--orb-size) * 0.31);
  height: calc(var(--orb-size) * 0.31);
  opacity: 1;
  background: rgb(255 255 255 / 96%);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 34%),
    0 0 18px rgb(255 237 251 / 42%);
  transform:
    translate(-50%, -50%)
    rotate(var(--orb-turn-angle))
    translateY(calc(var(--orb-size) * -0.28))
    scale(0.22);
  will-change: transform, opacity;
  transition:
    background 220ms ease,
    box-shadow 220ms ease,
    opacity 220ms ease,
    transform 220ms ease;
}

.control-orb.is-active .orb-aura {
  transform: scale(1.22);
  opacity: calc(0.52 + var(--orb-bloom) * 0.34);
}

.control-orb.is-active .orb-body {
  transform: scale(0.9);
  background:
    radial-gradient(circle at 58% 34%, rgb(255 255 255 / 76%), transparent 8%),
    linear-gradient(145deg, #87efff 0%, #f6b1ff 38%, #5071ff 74%, #1942ff 100%);
  filter: saturate(1.24);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 48%),
    inset 0 0 0 1px rgb(255 255 255 / 16%),
    0 28px 68px rgb(31 81 255 / 26%);
}

.control-orb.is-active .orb-track,
.control-orb.is-active .orb-progress {
  opacity: 1;
}

.control-orb.is-active .orb-track {
  transform: scale(1);
}

.control-orb.is-active .orb-handle {
  background:
    radial-gradient(circle at 60% 34%, rgb(255 255 255 / 98%), transparent 16%),
    linear-gradient(145deg, rgb(223 185 255) 0%, rgb(164 194 255) 58%, rgb(120 151 255) 100%);
  box-shadow:
    0 0 0 3px rgb(13 17 34 / 38%),
    0 16px 32px rgb(0 0 0 / 28%);
  transform:
    translate(-50%, -50%)
    rotate(var(--orb-turn-angle))
    translateY(calc(var(--orb-size) * -0.58))
    scale(1);
}

.control-orb.is-active .orb-progress {
  transform: scale(1);
}

.control-orb.is-dragging .orb-aura,
.control-orb.is-dragging .orb-body,
.control-orb.is-dragging .orb-track,
.control-orb.is-dragging .orb-progress,
.control-orb.is-dragging .orb-handle {
  transition-duration: 0s;
}

@media (min-width: 640px) {
  .hero-frame {
    padding-top: 72px;
  }

  .carousel-shell {
    height: 58vh;
  }
}
</style>
