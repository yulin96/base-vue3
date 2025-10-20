<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { onMounted } from 'vue'

definePage({
  meta: { index: 10 },
})

const { start } = useLoading(window.IMG_RESOURCES ?? [])

onMounted(() => {
  gsap.context(() => {
    gsap.timeline({ delay: 0.5 }).then(() => {
      start()
    })
  }, '.index')
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center bg-blue flex-col">
        <base-stars></base-stars>
      </main>
    </section>
  </div>
</template>
