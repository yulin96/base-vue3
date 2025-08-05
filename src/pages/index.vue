<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  gsap.context(() => {
    gsap.timeline({ delay: 0.5 })
  }, '.index')
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
