<script setup lang="ts">
import { useGsapContext } from '@/hooks/animation/useGsapContext'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center bg-[#e5d1b6]">
        <div class="text-120">品牌</div>
      </main>
    </section>
  </div>
</template>
