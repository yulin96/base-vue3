<script setup lang="ts">
import { useStore } from '@/stores/user'
import { randomNum } from '@/utils/random'
import Lottie from 'lottie-web'
import { onMounted, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const toIndex = () => {
  router.replace({ path: '/' })
}

const { user } = useStore()
const id = String(user.other?.errId || randomNum(1, 10))
user.other.errId = id

const errorRef = useTemplateRef('errorRef')

/*  */
onMounted(() => {
  if (!errorRef.value) return console.error('errorEle is null')
  errorRef &&
    Lottie?.loadAnimation({
      path: `https://oss.eventnet.cn/H5/zz/public/lotties/404/${id}.json`,
      container: errorRef.value,
      loop: true,
      autoplay: true,
    })
})
</script>

<template>
  <div class="wrapperErr">
    <div class="error">ERROR 404</div>
    <div ref="errorRef"></div>
    <div class="back" @click="toIndex">回首页</div>
  </div>
</template>

<style>
.wrapperErr {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: white;
}

.wrapperErr .error {
  z-index: 9;
  font-size: 50px;
  transition: all 1s;
}

.wrapperErr .back {
  position: relative;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 600px;
  height: 100px;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  background: #373d60;
  border-radius: 50px;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}

.wrapperErr .back::after {
  position: absolute;
  width: 580px;
  height: 80px;
  content: '';
  border: 1px solid #fff6;
  border-radius: 50px;
}

.wrapperErr .back::before {
  position: absolute;
  width: 560px;
  height: 60px;
  content: '';
  border: 1px dashed #fff6;
  border-radius: 50px;
}

.wrapperErr #error {
  width: 100%;
  height: 500px;
}
</style>
