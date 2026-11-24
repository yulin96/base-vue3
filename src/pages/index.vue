<script setup lang="ts">
import { useTemplateRef } from 'vue'

import { useGsapContext } from '@/hooks/animation/useGsapContext'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

const page = useTemplateRef('page')
useGsapContext(page, () => {})
</script>

<template>
  <div class="size-full">
    <section ref="page" class="scroll-box index">
      <main class="content"></main>
    </section>
  </div>
</template>
