<script setup lang="ts">
import { useLoading } from '@/hooks/useLoading'
import { useRouteTransition } from '@/hooks/useRouterTransition'
import { registerWechatShare } from '@/plugins/share'
import { sleep } from '@/utils/common'
import { nextTick, onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

const { start } = useLoading(window.IMG_RESOURCES ?? [])
const { name } = useRouteTransition()

registerWechatShare()

// const { locale } = useI18n()
// const { VITE_APP_LOCALSTORAGE_NAME: localName } = import.meta.env
// watch(locale, (newVal) => {
//   localStorage.setItem(`${(localName || 'test')}-local`, newVal)
// })

const preloadImg = async () => {
  if (document.readyState !== 'complete') return
  document.removeEventListener('readystatechange', preloadImg)

  await nextTick()
  await sleep(1200)
  requestAnimationFrame(start)
}

onMounted(async () => {
  const title = import.meta.env.VITE_APP_TITLE
  if (title) {
    document.title = title + '​'
    document.title = title
  }

  if (document.readyState === 'complete') preloadImg()
  else document.addEventListener('readystatechange', preloadImg)
})
</script>

<template>
  <Toaster rich-colors :duration="2000" position="top-center" />

  <router-view v-slot="{ Component }">
    <template v-if="Component">
      <transition :name="name">
        <keep-alive :exclude="[]">
          <component :is="Component"></component>
        </keep-alive>
      </transition>
    </template>
  </router-view>
</template>

<style>
html,
body,
.scroll-box {
  background-color: var(--main-color);
}
</style>
