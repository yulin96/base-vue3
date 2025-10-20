<script setup lang="ts">
defineProps<{ color: string }>()
</script>

<template>
  <div class="center tracking-2 rounded-full p-0 indent-2 font-semibold" :style="{ backgroundColor: color }">
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
    transparent 50deg,
    #191919 110deg,
    transparent 130deg,
    transparent 360deg
  );
  animation: rotate 4s linear infinite;
}

.conic::after {
  content: '';
  position: absolute;
  z-index: -1;
  background-color: #e4dfcb;
  border-radius: 9999px;
  inset: 4px;
}
</style>
