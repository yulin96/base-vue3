<script setup lang="ts">
import { deepClone } from '@/utils/convert'
import { range } from 'es-toolkit'
import { onMounted } from 'vue'

interface BarrageItem {
  id: string | number
  image?: string
  content: string
}

const barrageList = defineModel<BarrageItem[]>('list', { required: true })
const { gap = 20, speed = 90, row } = defineProps<{ gap?: number | [number, number]; speed?: number; row: number }>()

const conveyorBelt: BarrageItem[] = deepClone(barrageList.value)

const vw1 = innerWidth / 100

function createBarrage(id: number) {
  console.log(id)
}

onMounted(() => {
  range(0, row).forEach((id) => createBarrage(id))
})
</script>

<template>
  <div></div>
</template>
