<script setup lang="ts">
import { useTransform } from '@/hooks/interaction/legacy/useTransform'

const props = withDefaults(
  defineProps<{
    src: string
    containerClass?: string
    imageClass?: string
    defaultScale?: number
    minScale?: number
    maxScale?: number
    defaultX?: number
    defaultY?: number
  }>(),
  {
    containerClass: 'size-full',
    imageClass: 'size-full max-h-none max-w-none',
    defaultScale: 1,
    minScale: 0.6,
    maxScale: 5,
    defaultX: 0,
    defaultY: 0,
  },
)

const { key } = useTransform({
  scale: {
    default: props.defaultScale,
    min: props.minScale,
    max: props.maxScale,
  },

  position: {
    x: props.defaultX,
    y: props.defaultY,
  },
})
</script>

<template>
  <div class="overflow-hidden" :class="props.containerClass">
    <img :ref="key" :class="props.imageClass" :src="props.src" alt="" />
  </div>
</template>
