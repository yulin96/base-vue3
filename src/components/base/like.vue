<script setup lang="ts">
import Lottie, { type AnimationItem } from 'lottie-web'
import { onMounted, onUnmounted, useTemplateRef, watchPostEffect } from 'vue'

const { like, json } = defineProps<{ like: boolean; json: string }>()

// fetch('https://oss.eventnet.cn/H5/zz/public/lotties/like/like1.json')
//   .then((res) => res.json())
//   .then((res) => {
//     window['lottieJson-like'] = res
//   })

const likeRef = useTemplateRef('likeRef')

let lottieLike: AnimationItem | null = null

watchPostEffect(() => {
  if (like) {
    lottieLike?.goToAndPlay(0, true)
  } else {
    lottieLike?.goToAndStop(0, true)
  }
})

/*  */
onMounted(() => {
  if (!likeRef.value) return console.error('likeEle is null')
  lottieLike = Lottie.loadAnimation({
    container: likeRef.value,
    loop: false,
    autoplay: false,
    renderer: 'canvas',
    animationData: json,
  })

  lottieLike.addEventListener('config_ready', () => {
    lottieLike?.goToAndStop(like ? lottieLike.totalFrames - 1 : 0, true)
  })
})

onUnmounted(() => {
  lottieLike?.destroy()
})
</script>

<template>
  <div class="size-100">
    <div ref="likeRef" class="h-full w-full scale-[1.2]"></div>
  </div>
</template>
