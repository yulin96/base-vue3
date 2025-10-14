<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { showInfoToast, showSuccessToast } from '@/shared/vant/toast'
import axios, { toFormData } from 'axios'
import { onMounted, onUnmounted } from 'vue'

const { start, cleanup } = useLoading(window.IMG_RESOURCES ?? [])

onMounted(() => {
  gsap.context(() => {
    gsap.timeline({ delay: 0.5 }).then(() => {
      start()
    })
  }, '.index')
})

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
      <main class="content relative p-20">
        <com-seal-touch @next="test"></com-seal-touch>
      </main>
    </section>
  </com-main>
</template>

<route lang="json">
{ "meta": { "index": 10 } }
</route>
