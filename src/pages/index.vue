<script setup lang="ts">
import { useGsapContext } from '@/hooks/animation/useGsapContext'
import { showScan } from '@/utils/platform/showScan'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

const openScan = () => {
  showScan().then((res) => {
    console.log(res)
  })
}

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center">
        <div class="size-90 ring" btn @click="openScan"></div>
      </main>
    </section>
  </div>
</template>
