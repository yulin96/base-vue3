<script setup lang="ts">
import NumberFlow, { continuous } from '@number-flow/vue'

defineProps<{ value: number }>()
</script>

<template>
  <number-flow
    :plugins="[continuous]"
    :value="value"
    :trend="1"
    :format="{ useGrouping: false }"
    will-change
  ></number-flow>
</template>
