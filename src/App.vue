<script setup lang="ts">
import { useRouteTransition } from '@/hooks/useRouterTransition'
import { themeVars } from '@/shared/config/vant'
import { getWechatConfig } from '@/shared/third/wx'
import { registerButtonEffect } from '@/shared/user/registerButtonEffect'
import { registerWechatShare } from '@/shared/user/share'
import { isWeChat } from '@/utils/ua'
import { isHttps } from '@/utils/validator'
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
</script>

<template>
  <teleport to="body">
    <toaster :rich-colors="false" :expand="false" position="top-center" :visible-toasts="2" :duration="2000" />
  </teleport>

  <van-config-provider :theme-vars="themeVars" theme-vars-scope="global">
    <router-view v-slot="{ Component, route }">
      <template v-if="Component">
        <transition :name>
          <keep-alive :exclude="[]">
            <div :key="route.name" class="scroll-box">
              <component :is="Component"></component>
            </div>
          </keep-alive>
        </transition>
      </template>
    </router-view>
  </van-config-provider>
</template>

<style>
html,
body,
.scroll-box {
  background-color: var(--main-color);
}
</style>
