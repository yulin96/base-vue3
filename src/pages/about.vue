<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  gsap.context(() => {
    gsap.timeline({ delay: 0.3 })
  }, '.about')
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box about">
      <main class="content">
        <div class="my-620" @click="router.replace({ name: '/' })">about123 123</div>
        <div class="mt-60">about123 cc f12313 aa aa dd 123 aa 22</div>
      </main>
    </section>
  </div>
</template>

<route lang="json">
{
  "meta": {
    "index": 20
  }
}
</route>
