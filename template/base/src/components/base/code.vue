<script setup lang="ts">
import { ref, toValue, useTemplateRef, watchPostEffect, type MaybeRefOrGetter } from 'vue'

const qrCodeRef = useTemplateRef('qrCodeRef')

const props = defineProps<{ code: string; render?: MaybeRefOrGetter<boolean> }>()

watchPostEffect(() => {
  const value = toValue(props.render)
  if (value) {
    const bounding = qrCodeRef.value?.getBoundingClientRect()
    const app = document.querySelector('#app')
    if (bounding && app) {
      const { width, height, top, left } = bounding
      target[0] = +((app.clientWidth - 50) / width).toFixed(2)
      target[1] = +(innerHeight / 2 - (top + height / 2) - 50).toFixed(2)
      target[2] = +(innerWidth / 2 - (left + width / 2)).toFixed(2)
    }
  }
})

const isBig = ref(false)

const target: [number, number, number] = [2, 0, 0]

const toggleCode = (close?: boolean) => {
  if (close) isBig.value = true
  gsap.to(qrCodeRef.value, {
    scale: isBig.value ? 1 : target[0],
    y: isBig.value ? 0 : target[1],
    x: isBig.value ? 0 : target[2],
    duration: 0.3,
    ease: 'back.out(1.7)',
  })
  isBig.value = !isBig.value
}

defineExpose({ toggleCode })
</script>

<template>
  <div ref="qrCodeRef" class="relative z-20" v-bind="$attrs" @click="toggleCode()">
    <img class="h-full w-full" :src="code" />
  </div>
  <van-overlay :show="isBig" class="z-10" @click="toggleCode()"></van-overlay>
</template>
