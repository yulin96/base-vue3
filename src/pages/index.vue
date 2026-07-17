<script setup lang="ts">
import { apiGetPhoneAuthToken, apiGetPhoneByToken } from '@/api/phone-auth'
import { useGsapContext } from '@/hooks/animation/useGsapContext'
import { PhoneNumberServer } from 'aliyun_numberauthsdk_web'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

interface SdkResponse {
  code?: number
  msg?: string
  spToken?: string
}

interface PhoneNumberServerWithClose extends PhoneNumberServer {
  closeLoginPage?: () => void
}

const loading = ref(false)
const mobile = ref('')
const phoneNumberServer = new PhoneNumberServer() as PhoneNumberServerWithClose

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})

async function loginWithPhone() {
  if (loading.value) return

  loading.value = true
  mobile.value = ''

  try {
    const tokenResponse = await apiGetPhoneAuthToken()
    await checkLoginAvailable(tokenResponse.data.accessToken, tokenResponse.data.jwtToken)
    const spToken = await getLoginToken()
    const phoneResponse = await apiGetPhoneByToken(spToken)

    mobile.value = phoneResponse.data.mobile
    phoneNumberServer.closeLoginPage?.()
    toast.success('手机号获取成功')
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}

function checkLoginAvailable(accessToken: string, jwtToken: string) {
  return new Promise<void>((resolve, reject) => {
    phoneNumberServer.checkLoginAvailable({
      accessToken,
      jwtToken,
      success: (result) => {
        const response = toSdkResponse(result)
        response.code === 600000 ? resolve() : reject(new Error(response.msg || '当前网络不支持一键登录'))
      },
      error: (result) => reject(new Error(toSdkResponse(result).msg || '一键登录鉴权失败')),
    })
  })
}

function getLoginToken() {
  return new Promise<string>((resolve, reject) => {
    let settled = false
    const privacyName = import.meta.env.VITE_PHONE_AUTH_PRIVACY_NAME
    const privacyUrl = import.meta.env.VITE_PHONE_AUTH_PRIVACY_URL

    phoneNumberServer.getLoginToken({
      authPageOption: {
        navText: '手机号快捷登录',
        subtitle: '请输入手机号中间四位完成安全校验',
        btnText: '本机号码一键登录',
        isHideLogo: true,
        isDialog: false,
        manualClose: true,
        privacyVenderIndex: privacyName && privacyUrl ? 1 : 0,
        ...(privacyName && privacyUrl ? { privacyOne: [privacyName, privacyUrl] } : {}),
        privacyAlertConfig: {
          isLoginShowPrivacyAlert: true,
          privacyAlertIsNeedAutoLogin: true,
        },
      },
      success: (result: unknown) => {
        settled = true
        const response = toSdkResponse(result)
        response.code === 600000 && response.spToken
          ? resolve(response.spToken)
          : reject(new Error(response.msg || '获取运营商认证凭证失败'))
      },
      error: (result: unknown) => {
        settled = true
        reject(new Error(toSdkResponse(result).msg || '一键登录失败'))
      },
      watch: (status: number) => {
        if (status === 2 && !settled) {
          settled = true
          reject(new Error('已取消一键登录'))
        }
      },
    })
  })
}

function toSdkResponse(value: unknown): SdkResponse {
  return value && typeof value === 'object' ? (value as SdkResponse) : {}
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) return response.data.message
  }

  return error instanceof Error ? error.message : '一键登录失败，请稍后重试'
}
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content flex flex-col items-center px-48 pt-260 text-center">
        <div class="phone-icon flex size-128 items-center justify-center rounded-full">📱</div>
        <h1 class="mt-48 text-48 font-semibold text-slate-900">手机号快捷登录</h1>
        <p class="mt-24 text-28 leading-44 text-slate-500">请使用已开启移动数据网络的手机完成认证</p>

        <button
          class="login-button mt-80 h-96 w-full rounded-48 text-32 font-medium text-white disabled:opacity-60"
          type="button"
          :disabled="loading"
          @click="loginWithPhone"
        >
          {{ loading ? '正在处理中' : '本机号码一键登录' }}
        </button>

        <p v-if="mobile" class="mt-40 text-30 text-emerald-600">已获取手机号：{{ mobile }}</p>
        <p class="mt-28 text-24 leading-38 text-slate-400">
          登录过程中需要输入手机号中间四位，并同意运营商及平台服务协议
        </p>
        <RouterLink class="mt-40 text-26 text-blue-600" to="/verify-phone">前往本机号码校验</RouterLink>
      </main>
    </section>
  </div>
</template>

<style scoped>
.index {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 48%);
}

.phone-icon {
  background: rgba(37, 99, 235, 0.1);
  box-shadow: 0 20px 60px rgba(37, 99, 235, 0.16);
  font-size: 64px;
}

.login-button {
  background: #2563eb;
  box-shadow: 0 16px 40px rgba(37, 99, 235, 0.24);
}

.login-button:active {
  background: #1d4ed8;
}
</style>
