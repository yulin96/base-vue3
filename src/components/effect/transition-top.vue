<template>
  <transition name="slide-up">
    <slot></slot>
  </transition>
</template>

<style scoped>
:slotted(.slide-up-enter-active),
:slotted(.slide-up-leave-active) {
  transition: all 0.3s ease;
  position: absolute;
}

:slotted(.slide-up-enter-from) {
  opacity: 0;
  z-index: 10;
  filter: blur(12px);
  transform: translateY(90px) translateZ(0);
}

:slotted(.slide-up-leave-to) {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(-90px) translateZ(0);
}
</style>
