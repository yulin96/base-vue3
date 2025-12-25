<script setup lang="ts">
import { useRouteTransition } from '@/hooks/useRouterTransition'
import { registerWechatShare } from '@/plugins/share'
import { isWeChat } from '@/utils/platform/ua'
import { getWechatConfig } from '@/utils/platform/wechat'
import { isHttps } from '@/utils/validate'
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

const { name } = useRouteTransition()

if (isWeChat() && isHttps()) {
  getWechatConfig().then(() => {
    registerWechatShare()
  })
}

// const { locale } = useI18n()
// const { VITE_APP_LOCALSTORAGE_NAME: localName } = import.meta.env
// watch(locale, (newVal) => {
//   localStorage.setItem(`${(localName || 'test')}-local`, newVal)
// })

onMounted(async () => {
  const title = import.meta.env.VITE_APP_TITLE
  if (title) {
    document.title = title + ' '
    document.title = title
  }
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
