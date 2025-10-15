<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { onMounted, onUnmounted } from 'vue'

definePage({
  meta: { index: 10 },
})

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
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content"></main>
    </section>
  </div>
</template>
