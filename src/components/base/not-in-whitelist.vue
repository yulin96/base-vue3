<script setup lang="ts">
const show = defineModel<boolean>({ required: true })

defineProps<{ title?: string }>()
</script>

<template>
  <van-popup v-model:show="show" transition="popup" :close-on-click-overlay="false">
    <div class="center h-900 w-full">
      <div
        class="relative flex h-[588px] w-[561px] flex-col items-center rounded-[12px] bg-[url(https://oss.eventnet.cn/H5/zz/public/tips/whitelist/bg.png)] bg-contain bg-no-repeat pt-150"
      >
        <img
          class="absolute -top-[100px] w-[203px]"
          src="https://oss.eventnet.cn/H5/zz/public/tips/whitelist/icon.png"
        />
        <div class="-mt-[60px] indent-[4px] text-[50px] font-semibold tracking-[4px] text-[#c42420]">温馨提示</div>
        <div
          class="text-30 mt-[40px] min-h-[120px] w-full px-[20px] text-center indent-[1px] leading-[1.7] tracking-[1px] whitespace-pre-line"
        >
          {{ title ?? '您输入的信息不在邀请名单中\n请重新输入或联系邀约人' }}
        </div>

        <div
          class="center mt-[60px] h-[90px] w-[400px] rounded-full bg-[#111] indent-[2px] tracking-[2px] text-white"
          @click="show = false"
        >
          知道了
        </div>
      </div>
    </div>
  </van-popup>
</template>
