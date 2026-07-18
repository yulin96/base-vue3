<script setup lang="ts">
import { useRouteTransition } from '@/hooks/interaction/useRouterTransition'
import { setupPreloadImg } from '@/plugins/setup/preloadImg'
import { registerWechatShare } from '@/utils/platform/wechatShare'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

const { name } = useRouteTransition()

void registerWechatShare()
void setupPreloadImg()
</script>

<template>
  <Toaster rich-colors :duration="3000" position="top-center" :visible-toasts="2"></Toaster>

  <router-view v-slot="{ Component, route }">
    <template v-if="Component">
      <transition :name="name">
        <keep-alive :exclude="[]" :max="10">
          <component :is="Component" :key="route.fullPath"></component>
        </keep-alive>
      </transition>
    </template>
  </router-view>
</template>
