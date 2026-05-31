<script setup lang="ts">
defineProps<{ highlight: string }>()
</script>

<template>
  <div class="center relative z-0 size-full">
    <div v-bind="$attrs" class="conic pointer-events-none absolute inset-0 -z-10 size-full"></div>
    <slot />
  </div>
</template>

<style scoped>
@keyframes rotate {
  100% {
    transform: translate(-50%, -50%) rotate(1turn);
  }
}

.conic {
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);

  -webkit-mask-composite: xor;
  mask-composite: exclude;

  padding: 4px;
}

.conic::before {
  content: '';
  position: absolute;
  z-index: -2;
  left: 50%;
  top: 50%;
  width: 200vw;
  height: 200vw;
  transform: translate(-50%, -50%);
  background-image: conic-gradient(
    v-bind(highlight) 0deg,
    transparent 90deg,
    v-bind(highlight) 180deg,
    transparent 270deg,
    v-bind(highlight) 360deg
  );
  animation: rotate 4s linear infinite;
}
</style>
