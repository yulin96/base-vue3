<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {})
</script>

<template>
  <com-main ref="indexRef" class="index">
    <div class="content"></div>
  </com-main>
</template>

<route lang="json">
{ "meta": { "index": 10 } }
</route>
