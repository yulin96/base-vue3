<script setup lang="ts">
import { useRouteTransition } from '@/hooks/useRouterTransition'
import { getWechatConfig } from '@/shared/third/wx'
import { registerButtonEffect } from '@/shared/user/registerButtonEffect'
import { registerWechatShare } from '@/shared/user/share'
import { isWeChat } from '@/utils/ua'
import { isHttps } from '@/utils/validator'
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

registerButtonEffect()

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
  if (title) while (!document.title) document.title = title
})
</script>

<template>
  <teleport to="body">
    <toaster :rich-colors="false" :expand="false" position="top-center" :visible-toasts="2" :duration="2000" />
  </teleport>

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
