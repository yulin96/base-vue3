<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { showLoadingToast } from '@/shared/vant/toast'
import { onMounted, ref, useTemplateRef } from 'vue'

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

const barrageRef = useTemplateRef('barrageRef')
const data = ref<TBarrage[]>([
  { id: 1, text: '这是第一条弹幕' },
  { id: 2, text: '这是第二条弹幕' },
  { id: 3, text: '这是第三条弹幕' },
  { id: 4, text: '这是第四条弹幕' },
  { id: 5, text: '这是第五条弹幕' },
  { id: 6, text: '这是第六条弹幕' },
  { id: 7, text: '这是第七条弹幕' },
  { id: 8, text: '这是第八条弹幕' },
  { id: 9, text: '这是第九条弹幕' },
  { id: 10, text: '这是第十条弹幕' },
])
const currentId = ref(0)

const list = ref([])

onMounted(() => {
  barrageRef.value?.start()
})
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center flex-col">
        <div class="p-60 outline" @click="test">测试</div>
        <div class="h-500 w-700">
          <base-barrage ref="barrageRef" v-model:barrage-list="data"> </base-barrage>
        </div>
      </main>
    </section>

    <van-popup v-model:show="show" transition="popup">
      <div class="bg-blue rounded-30 size-600"></div>
    </van-popup>
  </div>
</template>
