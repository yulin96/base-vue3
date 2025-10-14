<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { showInfoToast, showSuccessToast } from '@/shared/vant/toast'
import axios, { toFormData } from 'axios'
import { onMounted, onUnmounted, ref } from 'vue'

const { start, cleanup } = useLoading(window.IMG_RESOURCES ?? [])

onMounted(() => {
  gsap.context(() => {
    gsap.timeline({ delay: 0.5 }).then(() => {
      start()
    })
  }, '.index')
})

const list = ref<string[]>([])

onUnmounted(() => {
  cleanup()
})

const test = (type: 'password' | 'stamp', content: string) => {
  if (type === 'password') {
    alert(`密码：${content}`)
  } else {
    axios.post('https://ayp.event1.cn/api/xhsfitf/checkStamp', toFormData({ stamp: content })).then((res) => {
      if (res.data.code == 200) return showSuccessToast('盖章成功')
      showInfoToast(res.data?.msg || '')
    })
  }
}
</script>

<template>
  <com-main>
    <section class="scroll-box index">
      <main class="content relative flex flex-col items-center bg-[#fafafa] p-20">
        <div class="text-36 pointer-events-none font-semibold">盖章测试</div>
        <div class="pointer-events-none h-1200 w-full overflow-scroll outline">
          <div
            v-for="item in list"
            :key="item"
            class="border-b py-12"
            :style="{ color: item.split('{').length - 1 === 5 ? 'green' : 'black' }"
          >
            {{ item }}
          </div>
        </div>

        <com-seal-touch v-model:list="list" @next="test"></com-seal-touch>
      </main>
    </section>
  </com-main>
</template>

<route lang="json">
{ "meta": { "index": 10 } }
</route>
