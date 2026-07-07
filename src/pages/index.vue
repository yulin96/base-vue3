<script setup lang="ts">
import { useGsapContext } from '@/hooks/animation/useGsapContext'
import { getUserImage } from '@/utils/dom/media'
import SparkMD5 from 'spark-md5'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})

let lastImageHash = ''

const test = () => {
  getUserImage().then((res) => {
    if (!res) return

    const reader = new FileReader()
    reader.onload = () => {
      const hash = SparkMD5.ArrayBuffer.hash(reader.result as ArrayBuffer)
      const isRepeat = hash === lastImageHash

      console.log('图片信息', hash, isRepeat, { name: res.name, size: res.size, type: res.type, hash, isRepeat })

      lastImageHash = hash
    }
    reader.readAsArrayBuffer(res)
  })
}
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center">
        <div class="p-30 ring" @click="test">测试</div>
      </main>
    </section>
  </div>
</template>
