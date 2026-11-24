<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

import { generateCaptcha } from '@/utils/dom/generateCaptcha'

const {
  captchaLength = 5,
  padding = 10,
  fontSize = 20,
} = defineProps<{ captchaLength?: number; padding?: number; fontSize?: number }>()

const captchaRef = useTemplateRef('captchaRef')

const captchaString = ref('')

const checkCaptcha = (input: string) => {
  return Boolean(captchaString.value) && input.toLowerCase() === captchaString.value.toLowerCase()
}

const refreshCaptcha = () => {
  const captcha = generateCaptcha({
    captchaDiv: captchaRef.value,
    captchaLength,
    padding,
    fontSize,
  })
  captchaString.value = captcha ?? ''
}

onMounted(() => {
  if (captchaRef.value) {
    refreshCaptcha()
  }
})

defineExpose({
  checkCaptcha,
  refreshCaptcha,
})
</script>

<template>
  <div ref="captchaRef" @click="refreshCaptcha"></div>
</template>
