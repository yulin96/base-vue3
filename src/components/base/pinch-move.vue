<script setup lang="ts">
import { useTransform } from '@/hooks/useTransform'

const { key } = useTransform({
  scale: {
    default: 1.2,
    min: 0.6,
    max: 5,
  },

  position: {
    x: -400,
    y: -180,
  },
})
</script>

<template>
  <div class="size-[600px] overflow-hidden">
    <img
      :ref="key"
      class="h-[1202px] max-h-none w-[2012px] max-w-none"
      src="https://oss.eventnet.cn/H5/zz/auto2/a/16/map.jpg"
      alt=""
    />
  </div>
</template>
