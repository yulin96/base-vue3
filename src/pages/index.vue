<script setup lang="ts">
import { useGsapContext } from '@/hooks/animation/useGsapContext'
import { getUserImage } from '@/utils/dom/media'
import { uploadFile } from '@/utils/file/uploadFile'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})

const test1 = () => {
  getUserImage().then(async (file) => {
    if (!file) return
    const [err, ossURL] = await uploadFile({ id: 'JURP', file, loading: true })
    if (err || !ossURL) throw '上传失败'

    const photo = ossURL
    const photo2 = 'https://oss.1ycloud.com/yl25/c06oiyq/zh-e4d215d11074e8e85f8cbec91122711f.png'

    window.api?.print({
      page: 'photo-6in-landscape',
      margin: 0,
      images: [
        { src: photo, xMm: 1.7, yMm: 1.5, widthMm: 152, heightMm: 104, fit: 'cover', rotate: 270 },
        { src: photo2, xMm: 100, yMm: 40.8, widthMm: 20, heightMm: 20, fit: 'cover', rotate: 270 },
      ],
      printer: { silent: true, copies: 1, useDefaultPageSize: true },
    })
  })
}

const test2 = () => {
  getUserImage().then(async (file) => {
    if (!file) return
    const [err, ossURL] = await uploadFile({ id: 'JURP', file, loading: true })
    if (err || !ossURL) throw '上传失败'

    const photo = ossURL

    window.api?.print({
      page: 'A3',
      margin: 0,
      images: [
        {
          src: 'https://oss.1ycloud.com/yl25/c06oiyq/zh-42730b61a6433f5b0a69b6d64bb17c15.png',
          xMm: 0,
          yMm: 0,
          widthMm: 297,
          heightMm: 420,
          fit: 'cover',
          rotate: 0,
        },
        { src: photo, xMm: 149, yMm: 226, widthMm: 269, heightMm: 172, fit: 'cover', rotate: 0 },
      ],
      printer: { silent: true, copies: 1 },
    })
  })
}

const test3 = () => {
  getUserImage().then(async (file) => {
    if (!file) return
    const [err, ossURL] = await uploadFile({ id: 'JURP', file, loading: true })
    if (err || !ossURL) throw '上传失败'

    const photo = ossURL

    window.api?.print({
      page: 'A4',
      margin: 0,
      images: [
        {
          src: 'https://oss.1ycloud.com/yl25/c06oiyq/zh-42730b61a6433f5b0a69b6d64bb17c15.png',
          xMm: 0,
          yMm: 0,
          widthMm: 210,
          heightMm: 297,
          fit: 'cover',
          rotate: 0,
        },
        { src: photo, xMm: 105, yMm: 160, widthMm: 190, heightMm: 122, fit: 'cover', rotate: 0 },
      ],
      printer: { silent: true, copies: 1 },
    })
  })
}
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center flex-col space-y-30">
        <div class="px-30 py-12 ring" @click="test1">6寸竖版</div>
        <div class="px-30 py-12 ring" @click="test2">A3</div>
        <div class="px-30 py-12 ring" @click="test3">A4</div>
      </main>
    </section>
  </div>
</template>
