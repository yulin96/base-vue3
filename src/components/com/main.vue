<script setup lang="ts">
import { useTemplateRef } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const scrollEle = useTemplateRef('scrollEle')
defineExpose({ scrollEle })
</script>

<template>
  <section class="wrapper">
    <main ref="scrollEle" class="wrapper" v-bind="$attrs">
      <slot></slot>
    </main>
  </section>
</template>
