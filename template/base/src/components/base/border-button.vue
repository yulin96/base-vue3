<script setup lang="ts">
defineProps<{ bgColor: string; highlight: string }>()
</script>

<template>
  <div class="center rounded-full p-0" :style="{ backgroundColor: bgColor }">
    <div class="conic center h-full w-full rounded-full">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@keyframes rotate {
  100% {
    transform: rotate(1turn);
  }
}

.conic {
  overflow: hidden;
  position: relative;
  z-index: 20;
}
.conic::before {
  content: '';
  position: absolute;
  z-index: -2;
  left: -50%;
  top: -50%;
  width: 200%;
  height: 200%;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(
    transparent 0deg,
    transparent 40deg,
    v-bind(highlight) 110deg,
    transparent 130deg,
    transparent 360deg
  );
  animation: rotate 4s linear infinite;
}

.conic::after {
  content: '';
  position: absolute;
  z-index: -1;
  background-color: v-bind(bgColor);
  border-radius: 9999px;
  inset: 6px;
}
</style>
