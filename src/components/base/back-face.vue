<script setup lang="ts">
import { useTemplateRef, watchPostEffect } from 'vue'

const { flip = false } = defineProps<{ flip?: boolean }>()

const flipRef = useTemplateRef('flipRef')

watchPostEffect(() => {
  gsap.to(flipRef.value, { rotateY: flip ? 180 : 0, duration: 0.3, ease: 'power1' })
})

/**
  <com-back-face :flip="showBack" class="size-full">
    <template #default>
      <div class="size-full rounded-12 bg-sky-200"></div>
    </template>
    <template #back>
      <div class="size-full rounded-12 bg-cyan-600"></div>
    </template>
  </com-back-face>
 */
</script>

<template>
  <div class="perspective-midrange">
    <section ref="flipRef" class="relative size-full transform-3d">
      <div
        :class="!flip ? 'pointer-events-auto' : 'pointer-events-none'"
        class="absolute top-0 left-0 size-full backface-hidden"
      >
        <slot></slot>
      </div>
      <div
        :class="flip ? 'pointer-events-auto' : 'pointer-events-none'"
        class="absolute top-0 left-0 size-full rotate-y-180 backface-hidden"
      >
        <slot name="back"> </slot>
      </div>
    </section>
  </div>
</template>
