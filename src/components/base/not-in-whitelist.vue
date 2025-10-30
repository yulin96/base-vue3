<script setup lang="ts">
const show = defineModel<boolean>({ required: true })

defineProps<{ title?: string }>()
</script>

<template>
  <van-popup v-model:show="show" transition="popup" :close-on-click-overlay="false">
    <div class="center h-900 w-full">
      <div
        class="rounded-12 relative flex h-588 w-561 flex-col items-center bg-[url(https://oss.eventnet.cn/H5/zz/public/tips/whitelist/bg.png)] bg-contain bg-no-repeat pt-150"
      >
        <img class="absolute -top-100 w-203" src="https://oss.eventnet.cn/H5/zz/public/tips/whitelist/icon.png" />
        <div class="text-50 tracking-4 -mt-60 indent-4 font-semibold text-[#c42420]">温馨提示</div>
        <div
          class="text-30 tracking-1 mt-40 min-h-120 w-full px-20 text-center indent-[1px] leading-[1.7] whitespace-pre-line"
        >
          {{ title ?? '您输入的信息不在邀请名单中\n请重新输入或联系邀约人' }}
        </div>

        <div
          class="center tracking-2 mt-60 h-90 w-400 rounded-full bg-[#111] indent-2 text-white"
          @click="show = false"
        >
          知道了
        </div>
      </div>
    </div>
  </van-popup>
</template>
