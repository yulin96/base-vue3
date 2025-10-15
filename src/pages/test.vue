<script setup lang="ts">
import { onMounted } from 'vue'

definePage({
  meta: { index: 20 },
})

onMounted(() => {
  gsap.context(() => {
    gsap.timeline({ delay: 0.3 })
  }, '.test')
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box test">
      <main class="content"></main>
    </section>
  </div>
</template>
