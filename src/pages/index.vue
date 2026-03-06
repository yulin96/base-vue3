<script setup lang="ts">
import { useGsapContext } from '@/hooks/useGsapContext'

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content"></main>
    </section>
  </div>
</template>

<route lang="json">
{ "meta": { "index": 10 } }
</route>
