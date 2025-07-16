<script setup lang="ts">
import { useTemplateRef } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const scrollElement = useTemplateRef('scrollElement')
defineExpose({ scrollElement })
</script>

<template>
  <section class="wrapper">
    <main ref="scrollElement" class="wrapper" v-bind="$attrs">
      <slot></slot>
    </main>
  </section>
</template>
