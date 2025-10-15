<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { showLoadingToast } from '@/shared/vant/toast'
import { onMounted, ref } from 'vue'

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

const show = ref(false)
const test = () => {
  // show.value = !show.value
  showLoadingToast({
    message: '加载中...',
    duration: 0,
  })
  // showInfoToast({ message: '测试', duration: 0 })
}
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center">
        <div class="p-60 outline" @click="test">测试</div>
      </main>
    </section>

    <van-popup v-model:show="show" transition="popup">
      <div class="bg-blue rounded-30 size-600"></div>
    </van-popup>
  </div>
</template>
