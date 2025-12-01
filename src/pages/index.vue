<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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
    <section class="scroll-box index" @click="router.replace({ name: '/about' })">
      <main class="content"></main>
    </section>
  </div>
</template>

<route lang="json">
{
  "meta": {
    "index": 10
  }
}
</route>
