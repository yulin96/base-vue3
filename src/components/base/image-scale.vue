<script setup lang="ts">
import Zoomist from '@/shared/zoomist'
import { showDialog } from 'vant'
import { watchPostEffect } from 'vue'

const { fillType = 'cover', url } = defineProps<{
  url: string
  fillType?: 'cover' | 'contain' | 'none'
}>()

const uuid = 'zoomist_' + +new Date()

let zoom: Zoomist | undefined

watchPostEffect(() => {
  if (url) {
    const dom = document.querySelector(`.zoomist.${uuid}`)
    if (dom) {
      if (zoom) zoom?.update()
      else zoom = new Zoomist(dom, { height: false, fill: fillType, maxRatio: 4 })
    } else showDialog({ message: 'NOT_HAVE_DOM' })
  }
})
</script>

<template>
  <div :class="[uuid]" class="zoomist h-full w-full" :data-zoomist-src="url"></div>
</template>
