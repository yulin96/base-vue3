<script setup lang="ts">
import { appStorageName } from '@/config/env'
import { goBack } from '@/router'
import { useStore } from '@/stores/user'
import { isPcMode } from '@/utils/platform/ua'
import { useStorage, useWindowSize } from '@vueuse/core'
import { ref, watch } from 'vue'
import type { RouteNamedMap } from 'vue-router/auto-routes'

const { back = undefined, size = 46 } = defineProps<{ back?: keyof RouteNamedMap; size?: number }>()

const { user } = useStore()
const legacyBackXY = Reflect.get(user, 'backXY') as { x: number; y: number } | undefined
const backXY = useStorage(`${appStorageName}_BACK_XY`, legacyBackXY ?? { x: 0, y: 0 })
if (legacyBackXY) Reflect.deleteProperty(user, 'backXY')
if (backXY.value.x === 0) backXY.value = { x: innerWidth - size - 12, y: innerHeight - 200 }

const pcMode = ref(isPcMode())

const { width, height } = useWindowSize()
watch(width, () => (pcMode.value = isPcMode()))

const clickBack = () => {
  return goBack(back === undefined ? undefined : { name: back })
}
</script>

<template>
  <van-floating-bubble
    v-if="!pcMode"
    v-model:offset="backXY"
    :style="{ '--van-floating-bubble-size': `${size}px` }"
    axis="xy"
    magnetic="x"
    :gap="12"
    :teleport="null"
    btn
    class="center"
    @click="clickBack"
  >
    <img class="size-full" src="../../assets/images/back.svg" alt="" draggable="false" />
  </van-floating-bubble>

  <div
    v-else
    btn
    class="center fixed right-20 bottom-300"
    :style="{ width: `${size * (height / 720)}px`, height: `${size * (height / 720)}px` }"
    @click="clickBack"
  >
    <img class="size-full" src="../../assets/images/back.svg" alt="" draggable="false" />
  </div>
</template>
