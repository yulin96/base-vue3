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

const data = ref([
  { id: 1, content: '这是第一条弹幕' },
  { id: 2, content: '这是第二条弹幕' },
  { id: 3, content: '这是第三条弹幕' },
  { id: 4, content: '这是第四条弹幕' },
  { id: 5, content: '这是第五条弹幕' },
  { id: 6, content: '这是第六条弹幕' },
  { id: 7, content: '这是第七条弹幕' },
  { id: 8, content: '这是第八条弹幕' },
  { id: 9, content: '这是第九条弹幕' },
  { id: 10, content: '这是第十条弹幕' },
])
const currentId = ref(0)
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center flex-col">
        <div class="p-60 outline" @click="test">测试</div>
        <div class="h-500 w-700">
          <base-barrage v-model="currentId" class="mt-100" :barrage-list="data">
            <div class="flex h-100 w-full items-center"></div>
            <div class="mt-60 flex h-100 w-full items-center"></div>
            <div class="mt-60 flex h-100 w-full items-center"></div>
            <div class="mt-60 flex h-100 w-full items-center"></div>
          </base-barrage>
        </div>
      </main>
    </section>

    <van-popup v-model:show="show" transition="popup">
      <div class="bg-blue rounded-30 size-600"></div>
    </van-popup>
  </div>
</template>
