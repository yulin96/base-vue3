<script setup lang="ts">
import { getOpenId } from '@/shared/user/getOpenId'
import { toUrl } from '@/shared/user/location'
import { useStore } from '@/stores/user'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const { url, auto = false } = defineProps<{ url: string; auto?: boolean }>()

const show = ref(false)

const openLink = () => {
  if (!url) return console.error('url is required')

  toUrl(`https://wechat.event1.cn/api/getCode?name=hudongweipingtai&action=${auto ? 2 : 1}&cUrl=${url}`)
}

const router = useRouter()
router.beforeEach((to) => {
  const { user } = useStore()
  const { openid } = user.wxInfo
  if (!openid && to.path !== '/') return { path: '/' }
})

onMounted(async () => {
  if (!(await getOpenId())) {
    show.value = true
    if (auto) {
      const body = document.querySelector('body')
      body && (body.style.display = 'none')

      openLink()
    }
  }
})
</script>

<template>
  <van-popup
    data-z-wx-login
    :show="show"
    :close-on-click-overlay="false"
    :overlay-class="'bg-black/30 backdrop-blur-md'"
    class="center bg-transparent"
  >
    <div class="rounded-10 flex w-[600px] flex-col items-center justify-center bg-white py-[60px]">
      <p class="mb-[40px] text-[32px]">您还没有登录</p>
      <p class="mb-[40px] text-[32px]">点击微信一键登录参与活动</p>
      <button
        class="flex h-[80px] w-[500px] items-center justify-center rounded-[12px] bg-[#12c164] text-white"
        @click="openLink"
      >
        <svg
          class="icon mr-[10px] w-[60px]"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="2625"
        >
          <path
            d="M690.1 377.4c5.9 0 11.8 0.2 17.6 0.5-24.4-128.7-158.3-227.1-319.9-227.1C209 150.8 64 271.4 64 420.2c0 81.1 43.6 154.2 111.9 203.6 5.5 3.9 9.1 10.3 9.1 17.6 0 2.4-0.5 4.6-1.1 6.9-5.5 20.3-14.2 52.8-14.6 54.3-0.7 2.6-1.7 5.2-1.7 7.9 0 5.9 4.8 10.8 10.8 10.8 2.3 0 4.2-0.9 6.2-2l70.9-40.9c5.3-3.1 11-5 17.2-5 3.2 0 6.4 0.5 9.5 1.4 33.1 9.5 68.8 14.8 105.7 14.8 6 0 11.9-0.1 17.8-0.4-7.1-21-10.9-43.1-10.9-66 0-135.8 132.2-245.8 295.3-245.8z m-194.3-86.5c23.8 0 43.2 19.3 43.2 43.1s-19.3 43.1-43.2 43.1c-23.8 0-43.2-19.3-43.2-43.1s19.4-43.1 43.2-43.1z m-215.9 86.2c-23.8 0-43.2-19.3-43.2-43.1s19.3-43.1 43.2-43.1 43.2 19.3 43.2 43.1-19.4 43.1-43.2 43.1z"
            p-id="2626"
            fill="#ffffff"
          ></path>
          <path
            d="M866.7 792.7c56.9-41.2 93.2-102 93.2-169.7 0-124-120.8-224.5-269.9-224.5-149 0-269.9 100.5-269.9 224.5S540.9 847.5 690 847.5c30.8 0 60.6-4.4 88.1-12.3 2.6-0.8 5.2-1.2 7.9-1.2 5.2 0 9.9 1.6 14.3 4.1l59.1 34c1.7 1 3.3 1.7 5.2 1.7 2.4 0 4.7-0.9 6.4-2.6 1.7-1.7 2.6-4 2.6-6.4 0-2.2-0.9-4.4-1.4-6.6-0.3-1.2-7.6-28.3-12.2-45.3-0.5-1.9-0.9-3.8-0.9-5.7 0.1-5.9 3.1-11.2 7.6-14.5zM600.2 587.2c-19.9 0-36-16.1-36-35.9 0-19.8 16.1-35.9 36-35.9s36 16.1 36 35.9c0 19.8-16.2 35.9-36 35.9z m179.9 0c-19.9 0-36-16.1-36-35.9 0-19.8 16.1-35.9 36-35.9s36 16.1 36 35.9c-0.1 19.8-16.2 35.9-36 35.9z"
            p-id="2627"
            fill="#ffffff"
          ></path>
        </svg>
        <p class="text-30">微信一键登录</p>
      </button>
    </div>
  </van-popup>
</template>
