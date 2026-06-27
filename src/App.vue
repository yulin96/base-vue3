<script setup lang="ts">
import { useRouteTransition } from '@/hooks/interaction/useRouterTransition'
import { useIdleLoading } from '@/hooks/state/useIdleLoading'
import { registerWechatShare } from '@/utils/platform/wechatShare'
import { nextTick, onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

const { start } = useIdleLoading(window.IMG_RESOURCES ?? [])
const { name } = useRouteTransition()

void registerWechatShare()

const preloadImg = async () => {
  if (document.readyState !== 'complete') return
  document.removeEventListener('readystatechange', preloadImg)

  await nextTick()
  start()
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
  <Toaster rich-colors :duration="3000" position="top-center" :visible-toasts="2"></Toaster>

  <router-view v-slot="{ Component, route }">
    <template v-if="Component">
      <transition :name="name">
        <keep-alive :exclude="[]">
          <component :is="Component" :key="route.fullPath"></component>
        </keep-alive>
      </transition>
    </template>
  </router-view>
</template>
