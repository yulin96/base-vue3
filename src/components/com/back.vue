<script setup lang="ts">
import router from '@/router'
import { useStore } from '@/stores/user'
import { isPcMode } from '@/utils/validator'
import { useWindowSize } from '@vueuse/core'
import { ref, watch } from 'vue'
import type { RouteNamedMap } from 'vue-router/auto-routes'

const { back, size = 46 } = defineProps<{ back?: keyof RouteNamedMap; size?: number }>()

const { user } = useStore()
if (user.backXY.x == 0) user.backXY = { x: innerWidth - size - 12, y: innerHeight - 200 }

const pcMode = ref(isPcMode())

const { width } = useWindowSize()
watch(width, () => (pcMode.value = isPcMode()))

const clickBack = async () => {
  router.replace({ name: back || '/' })
}
</script>

<template>
  <van-floating-bubble
    v-if="!pcMode"
    v-model:offset="user.backXY"
    :style="{ '--van-floating-bubble-size': `${size}px` }"
    axis="xy"
    magnetic="x"
    :gap="12"
    :teleport="null"
    class="center"
    @click="clickBack"
  >
    <img btn class="size-full" src="../../assets/imgs/back.svg" alt="" draggable="false" />
  </van-floating-bubble>

  <div
    v-else
    class="center fixed right-20 bottom-300"
    :style="{ width: `${size * (width / 720)}px`, height: `${size * (width / 720)}px` }"
    @click="clickBack"
  >
    <img btn class="size-full" src="../../assets/imgs/back.svg" alt="" draggable="false" />
  </div>
</template>
