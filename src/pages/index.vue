<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { onMounted, onUnmounted } from 'vue'

const { start, cleanup } = useLoading(window.IMG_RESOURCES ?? [])

onMounted(() => {
  gsap.context(() => {
    gsap.timeline({ delay: 0.5 }).then(() => {
      start()
    })
  }, '.index')
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <section class="scroll-box index">
    <main class="content"></main>
  </section>
</template>

<route lang="json">
{ "meta": { "index": 10 } }
</route>
