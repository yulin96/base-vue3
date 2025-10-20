<script setup lang="ts">
import { sample } from 'es-toolkit'

const props = defineProps<{ barrage: TBarrage }>()

const colorList = [
  ['#FF4C4C', '#FFFFFF', '#B22222'],
  ['#FFD700', '#000000', '#B8860B'],
  ['#1E90FF', '#FFFFFF', '#104E8B'],
  ['#ADFF2F', '#000000', '#6B8E23'],
  ['#8A2BE2', '#FFFFFF', '#4B0082'],
  ['#FF69B4', '#000000', '#C71585'],
  ['#FF8C00', '#FFFFFF', '#B45F06'],
  ['#00FFFF', '#000000', '#008B8B'],
  ['#2F4F4F', '#FFFFFF', '#000000'],
  ['#90EE90', '#000000', '#3CB371'],
  ['#FF1493', '#FFFFFF', '#C71585'],
  ['#00CED1', '#FFFFFF', '#008B8B'],
  ['#FFB6C1', '#000000', '#FF1493'],
  ['#32CD32', '#FFFFFF', '#228B22'],
  ['#FF6347', '#FFFFFF', '#DC143C'],
  ['#4169E1', '#FFFFFF', '#1E90FF'],
  ['#FFD700', '#FFFFFF', '#DAA520'],
  ['#FF00FF', '#FFFFFF', '#8B008B'],
  ['#00FA9A', '#000000', '#228B22'],
  ['#DC143C', '#FFFFFF', '#8B0000'],

  ['#FF7F50', '#FFFFFF', '#FF4500'],
  ['#20B2AA', '#FFFFFF', '#008080'],
  ['#7B68EE', '#FFFFFF', '#6A5ACD'],
  ['#3CB371', '#000000', '#2E8B57'],
  ['#FF69B4', '#FFFFFF', '#FF1493'],
  ['#87CEEB', '#000000', '#4682B4'],
  ['#DAA520', '#000000', '#B8860B'],
  ['#FF0000', '#FFFFFF', '#8B0000'],
  ['#00FF00', '#000000', '#006400'],
  ['#0000FF', '#FFFFFF', '#00008B'],
  ['#FFFF00', '#000000', '#DAA520'],
  ['#FF00FF', '#000000', '#8B008B'],
  ['#00FFFF', '#000000', '#008B8B'],
  ['#FFA500', '#FFFFFF', '#FF8C00'],
  ['#FF1493', '#FFFFFF', '#FF69B4'],
  ['#6495ED', '#FFFFFF', '#4169E1'],
  ['#FFB347', '#000000', '#FF8C00'],
  ['#98FB98', '#000000', '#32CD32'],
  ['#F0E68C', '#000000', '#DAA520'],
  ['#DDA0DD', '#000000', '#DA70D6'],
]

const color = sample(colorList)!
</script>

<template>
  <div
    class="relative flex h-full items-center rounded-full border-10 px-60 py-30 shadow-2xl"
    :style="{
      background: `${color[0]}`,
      color: color[1],
      borderColor: color[2],
      '--tw-shadow-color': `${color[0]}90`,
    }"
  >
    <img class="h-full rounded-full" :src="props.barrage.avatar" alt="" draggable="false" />
    <div class="text-80 ml-20 font-semibold whitespace-nowrap">{{ props.barrage.name }} : {{ props.barrage.text }}</div>
  </div>
</template>
