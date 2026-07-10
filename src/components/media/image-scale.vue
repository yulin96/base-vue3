<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

type ScaleMode = 'contain' | 'cover'

const props = withDefaults(
  defineProps<{
    src: string
    mode?: ScaleMode
    minScale?: number
    maxScale?: number
    draggable?: boolean
    scaleSensitivity?: number
    allowOverflow?: boolean
  }>(),
  {
    mode: 'cover',
    minScale: 0.5,
    maxScale: 4,
    draggable: true,
    scaleSensitivity: 1,
    allowOverflow: false,
  },
)

const containerRef = ref<HTMLDivElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)

const containerSize = reactive({ width: 0, height: 0 })
const imageSize = reactive({ width: 0, height: 0 })

const baseScale = ref(1)
const userScale = ref(1)
const translate = reactive({ x: 0, y: 0 })

const isReady = computed(
  () => containerSize.width > 0 && containerSize.height > 0 && imageSize.width > 0 && imageSize.height > 0,
)

const effectiveMinScale = computed(() => {
  const min = Math.max(0.05, props.minScale)
  return props.mode === 'cover' ? Math.max(1, min) : min
})

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const updateBaseScale = () => {
  if (!isReady.value) return
  const scaleX = containerSize.width / imageSize.width
  const scaleY = containerSize.height / imageSize.height
  baseScale.value = props.mode === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY)
}

const clampTranslate = () => {
  if (!isReady.value || props.mode !== 'cover' || props.allowOverflow) return
  const renderedWidth = imageSize.width * baseScale.value * userScale.value
  const renderedHeight = imageSize.height * baseScale.value * userScale.value
  const maxOffsetX = Math.max(0, (renderedWidth - containerSize.width) / 2)
  const maxOffsetY = Math.max(0, (renderedHeight - containerSize.height) / 2)
  translate.x = clamp(translate.x, -maxOffsetX, maxOffsetX)
  translate.y = clamp(translate.y, -maxOffsetY, maxOffsetY)
}

const setScale = (nextScale: number): number => {
  const clamped = clamp(nextScale, effectiveMinScale.value, Math.max(effectiveMinScale.value, props.maxScale))
  userScale.value = clamped
  clampTranslate()
  return clamped
}

const resetTransform = () => {
  userScale.value = 1
  translate.x = 0
  translate.y = 0
  clampTranslate()
}

const imgStyle = computed(() => ({
  transform: `translate(-50%, -50%) translate(${translate.x}px, ${translate.y}px) scale(${baseScale.value * userScale.value})`,
  opacity: isReady.value ? 1 : 0,
}))

const onImageLoad = () => {
  if (!imgRef.value) return
  imageSize.width = imgRef.value.naturalWidth
  imageSize.height = imgRef.value.naturalHeight
  updateBaseScale()
  resetTransform()
}

const onWheel = (event: WheelEvent) => {
  if (!isReady.value || !props.draggable) return
  event.preventDefault()
  const factor = Math.exp(-event.deltaY * 0.001)
  setScale(userScale.value * factor)
}

// 触摸/鼠标状态
const lastDrag = reactive({ x: 0, y: 0 })
const clickStartPos = reactive({ x: 0, y: 0 })
const hasMoved = ref(false)
const isMouseDown = ref(false)

// 双指缩放状态
const pinchStart = reactive({
  distance: 0,
  scale: 1,
  midX: 0,
  midY: 0,
  tx: 0,
  ty: 0,
  centerX: 0,
  centerY: 0,
})

const onClick = (event: MouseEvent) => {
  if (hasMoved.value) {
    event.stopImmediatePropagation()
    event.preventDefault()
  }
}

// ========== 鼠标事件（PC端拖拽） ==========
const onMouseDown = (event: MouseEvent) => {
  if (!props.draggable || event.button !== 0) return
  event.preventDefault()
  isMouseDown.value = true
  hasMoved.value = false
  lastDrag.x = event.clientX
  lastDrag.y = event.clientY
  clickStartPos.x = event.clientX
  clickStartPos.y = event.clientY

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (event: MouseEvent) => {
  if (!isMouseDown.value) return

  if (!hasMoved.value) {
    const dist = Math.hypot(event.clientX - clickStartPos.x, event.clientY - clickStartPos.y)
    if (dist > 3) hasMoved.value = true
  }

  const dx = event.clientX - lastDrag.x
  const dy = event.clientY - lastDrag.y
  translate.x += dx
  translate.y += dy
  lastDrag.x = event.clientX
  lastDrag.y = event.clientY
  clampTranslate()
}

const onMouseUp = () => {
  isMouseDown.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// ========== 触摸事件（移动端拖拽+双指缩放） ==========
const getDistance = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)

const getMidpoint = (t1: Touch, t2: Touch) => ({
  x: (t1.clientX + t2.clientX) / 2,
  y: (t1.clientY + t2.clientY) / 2,
})

const initPinch = (t1: Touch, t2: Touch): boolean => {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return false

  const distance = getDistance(t1, t2)
  if (distance < 10) return false

  const mid = getMidpoint(t1, t2)
  pinchStart.distance = distance
  pinchStart.scale = userScale.value
  pinchStart.midX = mid.x
  pinchStart.midY = mid.y
  pinchStart.tx = translate.x
  pinchStart.ty = translate.y
  pinchStart.centerX = rect.left + rect.width / 2
  pinchStart.centerY = rect.top + rect.height / 2
  return true
}

const onTouchStart = (event: TouchEvent) => {
  if (!props.draggable) return

  const touches = event.touches
  if (touches.length === 1) {
    // 单指：开始拖拽
    const touch = touches[0]!
    hasMoved.value = false
    lastDrag.x = touch.clientX
    lastDrag.y = touch.clientY
    clickStartPos.x = touch.clientX
    clickStartPos.y = touch.clientY
    pinchStart.distance = 0
  } else if (touches.length >= 2) {
    // 双指：开始缩放
    event.preventDefault()
    hasMoved.value = true
    initPinch(touches[0]!, touches[1]!)
  }
}

const onTouchMove = (event: TouchEvent) => {
  if (!props.draggable) return

  const touches = event.touches
  if (touches.length === 1 && pinchStart.distance === 0) {
    // 单指拖拽
    const touch = touches[0]!

    if (!hasMoved.value) {
      const dist = Math.hypot(touch.clientX - clickStartPos.x, touch.clientY - clickStartPos.y)
      if (dist > 3) hasMoved.value = true
    }

    const dx = touch.clientX - lastDrag.x
    const dy = touch.clientY - lastDrag.y
    translate.x += dx
    translate.y += dy
    lastDrag.x = touch.clientX
    lastDrag.y = touch.clientY
    clampTranslate()
  } else if (touches.length >= 2) {
    // 双指缩放
    event.preventDefault()

    const t1 = touches[0]!
    const t2 = touches[1]!
    const distance = getDistance(t1, t2)

    // 如果还没初始化 pinch 基准数据，或者之前是单指模式
    if (pinchStart.distance < 10) {
      if (!initPinch(t1, t2)) return
    }

    // 应用缩放灵敏度：ratio = 1 + (原始ratio - 1) * sensitivity
    const rawRatio = distance / pinchStart.distance
    const ratio = 1 + (rawRatio - 1) * props.scaleSensitivity
    const nextScale = pinchStart.scale * ratio

    // 先设置 scale 并获取实际值（可能被 clamp）
    const actualScale = setScale(nextScale)
    // 计算实际的缩放比例
    const actualRatio = actualScale / pinchStart.scale

    const mid = getMidpoint(t1, t2)

    // 计算新的位移：以双指中点为缩放中心，使用实际比例
    const C = { x: pinchStart.centerX, y: pinchStart.centerY }
    const M0 = { x: pinchStart.midX, y: pinchStart.midY }
    const T0 = { x: pinchStart.tx, y: pinchStart.ty }

    const newTx = mid.x - C.x - (M0.x - C.x - T0.x) * actualRatio
    const newTy = mid.y - C.y - (M0.y - C.y - T0.y) * actualRatio

    translate.x = newTx
    translate.y = newTy
    clampTranslate()
  }
}

const onTouchEnd = (event: TouchEvent) => {
  const touches = event.touches

  if (touches.length === 0) {
    // 所有手指离开
    pinchStart.distance = 0
  } else if (touches.length === 1) {
    // 从双指变单指，切换到拖拽模式
    const touch = touches[0]!
    lastDrag.x = touch.clientX
    lastDrag.y = touch.clientY
    pinchStart.distance = 0
  } else if (touches.length >= 2) {
    // 还有多指，重新初始化缩放基准
    initPinch(touches[0]!, touches[1]!)
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!containerRef.value) return
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    containerSize.width = entry.contentRect.width
    containerSize.height = entry.contentRect.height
    updateBaseScale()
    clampTranslate()
  })
  resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  // 清理可能残留的 window 级事件监听器（拖动中组件销毁时）
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(
  () => props.src,
  () => {
    resetTransform()
  },
)

watch(
  () => props.mode,
  () => {
    resetTransform()
    updateBaseScale()
  },
)

watch(
  () => [containerSize.width, containerSize.height, imageSize.width, imageSize.height, props.mode],
  () => {
    updateBaseScale()
    clampTranslate()
  },
  { immediate: true },
)
</script>

<template>
  <div
    ref="containerRef"
    class="relative size-full overflow-hidden"
    :class="{ 'touch-none': props.draggable }"
    @wheel="onWheel"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @click.capture="onClick"
  >
    <img
      ref="imgRef"
      class="pointer-events-none absolute top-1/2 left-1/2 will-change-transform select-none"
      :src="props.src"
      :style="imgStyle"
      draggable="false"
      alt=""
      @load="onImageLoad"
    />
  </div>
</template>
