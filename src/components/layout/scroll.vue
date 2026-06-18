<script setup lang="ts">
import { useScroll, useResizeObserver } from '@vueuse/core'
import { throttle } from 'es-toolkit'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { isIOS } from '@/utils/platform/ua'

const props = withDefaults(
  defineProps<{
    barWidth?: number | string

    barHeight?: number | string

    barColor?: string

    trackColor?: string

    alwaysShow?: boolean

    showBar?: boolean

    radius?: number | string

    overlay?: boolean

    shadow?: boolean

    throttleDelay?: number

    preventOverscroll?: boolean
  }>(),
  {
    barWidth: 6,
    barHeight: 'auto',
    barColor: '#90939966',
    trackColor: 'transparent',
    alwaysShow: true,
    showBar: false,
    radius: 999,
    overlay: false,
    shadow: false,
    throttleDelay: 0,
    preventOverscroll: false,
  },
)

const emit = defineEmits<{
  (e: 'scroll', state: { left: boolean; right: boolean; top: boolean; bottom: boolean; y: number }): void
}>()

const scrollRef = useTemplateRef<HTMLElement>('scrollRef')
const contentRef = useTemplateRef<HTMLElement>('contentRef')

const { y: scrollTop, arrivedState } = useScroll(scrollRef)

// 动态创建节流的事件触发器
let triggerEmit = (state: any) => {
  emit('scroll', state)
}

watch(
  () => props.throttleDelay,
  (delay) => {
    if (delay && delay > 0) {
      triggerEmit = throttle((state: any) => {
        emit('scroll', state)
      }, delay)
    } else {
      triggerEmit = (state: any) => {
        emit('scroll', state)
      }
    }
  },
  { immediate: true },
)

// 监听滚动状态并通过事件抛出
watch([arrivedState, scrollTop], () => {
  triggerEmit({
    ...arrivedState,
    y: scrollTop.value,
  })
})

const containerHeight = ref(0) // 容器可视高度
const scrollHeight = ref(0) // 内容总高度

// 更新滚动状态
const updateState = () => {
  if (scrollRef.value) {
    containerHeight.value = scrollRef.value.clientHeight
    scrollHeight.value = scrollRef.value.scrollHeight
  }
}

// 使用 ResizeObserver 监听容器和内容变化，规避 onUpdated 死循环隐患
useResizeObserver(scrollRef, updateState)
useResizeObserver(contentRef, updateState)

// 初始化更新
onMounted(updateState)

// iOS 16 以下滚动穿透与橡皮筋效果边界拦截优化
let startY = 0

const handleTouchStart = (e: TouchEvent) => {
  startY = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (!scrollRef.value || !props.preventOverscroll) return
  const el = scrollRef.value
  const currentY = e.touches[0].clientY
  const dy = currentY - startY
  const scrollTopVal = el.scrollTop
  const scrollHeightVal = el.scrollHeight
  const clientHeightVal = el.clientHeight

  // 下拉且已在顶部
  if (dy > 0 && scrollTopVal <= 0) {
    if (e.cancelable) e.preventDefault()
  }
  // 上拉且已在底部
  if (dy < 0 && scrollTopVal + clientHeightVal >= scrollHeightVal) {
    if (e.cancelable) e.preventDefault()
  }
}

watch(
  [() => props.preventOverscroll, scrollRef],
  ([prevent, el]) => {
    if (!el) return
    // 仅在 iOS 且开启拦截时绑定事件以防性能损耗
    if (prevent && isIOS()) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true })
      el.addEventListener('touchmove', handleTouchMove, { passive: false })
    } else {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
    }
  },
  { immediate: true },
)

// 计算滑块高度
const thumbHeight = computed(() => {
  if (scrollHeight.value <= containerHeight.value) return 0

  if (props.barHeight && props.barHeight !== 'auto') {
    const h = Number.parseFloat(String(props.barHeight))
    if (!Number.isNaN(h)) return h
  }

  // 比例 = 可视高度 / 总高度
  const height = (containerHeight.value / scrollHeight.value) * containerHeight.value
  return Math.max(height, 20) // 最小高度 20px
})

// 计算滑块位置 Top
const thumbTop = computed(() => {
  if (scrollHeight.value <= containerHeight.value) return 0

  const maxScrollTop = scrollHeight.value - containerHeight.value // 最大滚动距离
  const maxThumbTop = containerHeight.value - thumbHeight.value // 滑块最大位移

  if (maxScrollTop <= 0) return 0

  // 当前滚动占比 * 总滑块可移动距离
  return (scrollTop.value / maxScrollTop) * maxThumbTop
})

// 外层容器样式：如果不悬浮，则腾出右侧空间
const wrapperStyle = computed(() => {
  if (props.overlay || !props.showBar) return {}
  const width = typeof props.barWidth === 'number' ? `${props.barWidth}px` : props.barWidth
  return { paddingRight: width }
})

// 样式计算
const barStyle = computed(() => ({
  width: typeof props.barWidth === 'number' ? `${props.barWidth}px` : props.barWidth,
  backgroundColor: props.trackColor,
  right: props.overlay ? '2px' : '0px',
  display: props.showBar && thumbHeight.value > 0 ? 'block' : 'none',
}))

const thumbStyle = computed(() => ({
  height: `${thumbHeight.value}px`,
  transform: `translateY(${thumbTop.value}px)`,
  backgroundColor: props.barColor,
  borderRadius: typeof props.radius === 'number' ? `${props.radius}px` : props.radius,
}))

defineExpose({
  scrollTo: (options: ScrollToOptions) => scrollRef.value?.scrollTo(options),
  arrivedState,
  scrollTop,
})
</script>

<template>
  <div class="group relative h-full w-full overflow-hidden" :style="wrapperStyle">
    <div ref="scrollRef" class="scrollbar-hide h-full w-full overflow-x-hidden overflow-y-auto overscroll-none">
      <div ref="contentRef">
        <slot />
      </div>
    </div>

    <div
      class="pointer-events-none absolute -top-2 left-0 z-10 h-1/12 w-full bg-linear-to-b from-[#0002] to-transparent transition-opacity duration-150"
      :class="[props.shadow && !arrivedState.top ? 'opacity-100' : 'opacity-0']"
    ></div>

    <div
      class="pointer-events-none absolute -bottom-2 left-0 z-10 h-1/12 w-full bg-linear-to-t from-[#0002] to-transparent transition-opacity duration-150"
      :class="[props.shadow && !arrivedState.bottom ? 'opacity-100' : 'opacity-0']"
    ></div>

    <div
      v-show="props.showBar && containerHeight < scrollHeight"
      class="absolute top-0 h-full w-2.5 rounded-full bg-transparent transition-all duration-300 group-hover:bg-gray-200"
      :style="barStyle"
    >
      <div
        v-show="thumbHeight > 0"
        ref="thumbRef"
        class="pointer-events-none absolute top-0 right-0 w-full rounded-full"
        :style="thumbStyle"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
