<script setup lang="ts">
defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content center bg-[#e5d1b6]">
        <div class="brand-flow text-120">品牌</div>
      </main>
    </section>
  </div>
</template>

<style scoped>
.brand-flow {
  color: transparent;
  background-image: linear-gradient(
    105deg,
    #7b3c08 0%,
    #b9660e 12%,
    #f4c65d 24%,
    #fff3ad 32%,
    #c87612 44%,
    #8b4408 56%,
    #e5a52e 68%,
    #fff0a0 78%,
    #9c4c08 90%,
    #7b3c08 100%
  );
  background-position: 0 50%;
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 18px 20px 3px rgb(91 47 24 / 48%);
  animation: brand-gold-flow 2.8s linear infinite;
}

@keyframes brand-gold-flow {
  to {
    background-position: -200% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-flow {
    animation: none;
  }
}
</style>
