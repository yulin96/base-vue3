<script setup lang="ts">
const { play = false } = defineProps<{ play?: boolean }>()
</script>

<template>
  <div class="mx-auto mt-90 size-200 perspective-distant">
    <div
      class="relative size-200 transform-3d *:absolute *:size-200 *:bg-cover"
      :class="[play ? 'animate-rotate-cube' : '']"
    >
      <div class="transform-[translateZ(100px)]">
        <slot></slot>
      </div>
      <div class="transform-[rotateY(180deg)_translateZ(100px)]">
        <slot></slot>
      </div>
      <div class="transform-[rotateY(-90deg)_translateZ(100px)]">
        <slot></slot>
      </div>
      <div class="transform-[rotateY(90deg)_translateZ(100px)]">
        <slot></slot>
      </div>
      <div class="transform-[rotateX(90deg)_translateZ(100px)]">
        <slot></slot>
      </div>
      <div class="transform-[rotateX(-90deg)_translateZ(100px)]">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
