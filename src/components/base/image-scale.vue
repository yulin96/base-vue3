<script setup lang="ts">
import Zoomist from '@/shared/zoomist'
import { onUnmounted, watchPostEffect } from 'vue'

const { fillType = 'cover', url } = defineProps<{
  url: string
  fillType?: 'cover' | 'contain' | 'none'
}>()

const emit = defineEmits<{
  error: [Error]
}>()

const uuid = 'zoomist_' + +new Date()

let zoom: Zoomist | undefined

watchPostEffect(() => {
  if (url) {
    const dom = document.querySelector(`.zoomist.${uuid}`)
    if (dom) {
      if (zoom) {
        zoom.update()
      } else {
        try {
          zoom = new Zoomist(dom, { height: false, fill: fillType, maxRatio: 4 })
        } catch (error) {
          console.error('[ImageScale] Failed to initialize Zoomist:', error)
          emit('error', error instanceof Error ? error : new Error('Failed to initialize Zoomist'))
        }
      }
    } else {
      const error = new Error('DOM element not found')
      console.error('[ImageScale]', error.message)
      emit('error', error)
    }
  }
})

onUnmounted(() => {
  if (zoom) {
    zoom.destroy?.()
    zoom = undefined
  }
})
</script>

<template>
  <div :class="[uuid]" class="zoomist h-full w-full" :data-zoomist-src="url"></div>
</template>
