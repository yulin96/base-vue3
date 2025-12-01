<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

definePage({
  meta: { index: 20 },
})

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
        <div class="my-120" @click="router.replace({ name: '/' })">about123 123</div>
        <div class="mt-20">about123 aa 123 aa 22</div>
      </main>
    </section>
  </div>
</template>
