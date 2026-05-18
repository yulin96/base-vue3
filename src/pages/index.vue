<script setup lang="ts">
import { useGsapContext } from '@/hooks/useGsapContext'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.3 })
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content"></main>
    </section>
  </div>
</template>
