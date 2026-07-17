<script setup lang="ts">
import { apiGetPhoneVerifyToken, apiVerifyPhone, type PhoneVerifyResult } from '@/api/phone-auth'
import { PhoneNumberServer } from 'aliyun_numberauthsdk_web'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

defineOptions({ name: 'VerifyPhone' })
definePage({ meta: { index: 20 } })

interface SdkResponse {
  code?: number
  msg?: string
  spToken?: string
}

const phoneNumberServer = new PhoneNumberServer()
const phoneNumber = ref('')
const agreed = ref(true)
const loading = ref(false)
const result = ref<PhoneVerifyResult | null>(null)
const privacyName = import.meta.env.VITE_PHONE_AUTH_PRIVACY_NAME
const privacyUrl = import.meta.env.VITE_PHONE_AUTH_PRIVACY_URL

const resultText = computed(() => {
  if (!result.value) return ''
  if (result.value.verifyResult === 'PASS') return '校验通过：输入号码与本机号码一致'
  if (result.value.verifyResult === 'REJECT') return '校验未通过：输入号码与本机号码不一致'
  return '运营商暂时无法判断号码是否一致'
})

async function verifyPhone() {
  if (loading.value) return
  if (!/^1[3-9]\d{9}$/.test(phoneNumber.value)) return toast.warning('请输入有效的手机号')
  if (!agreed.value) return toast.warning('请先阅读并同意相关协议')

  const netType = phoneNumberServer.getConnection()
  if (netType === 'wifi') return toast.warning('请关闭 Wi-Fi 后使用手机数据网络校验')

  loading.value = true
  result.value = null

  try {
    const tokenResponse = await apiGetPhoneVerifyToken()
    await checkAuthAvailable(tokenResponse.data.accessToken, tokenResponse.data.jwtToken)
    const spToken = await getVerifyToken()
    result.value = (await apiVerifyPhone(phoneNumber.value, spToken)).data

    result.value.matched ? toast.success('本机号码校验通过') : toast.warning(resultText.value)
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}

function checkAuthAvailable(accessToken: string, jwtToken: string) {
  return new Promise<void>((resolve, reject) => {
    phoneNumberServer.checkAuthAvailable({
      accessToken,
      jwtToken,
      timeout: 10,
      success: (value) => {
        const response = toSdkResponse(value)
        response.code === 600000 ? resolve() : reject(sdkError(response, '本机号码校验鉴权失败'))
      },
      error: (value) => reject(sdkError(toSdkResponse(value), '本机号码校验鉴权失败')),
    })
  })
}

function getVerifyToken() {
  return new Promise<string>((resolve, reject) => {
    phoneNumberServer.getVerifyToken({
      timeout: 25,
      success: (value) => {
        const response = toSdkResponse(value)
        response.code === 600000 && response.spToken
          ? resolve(response.spToken)
          : reject(sdkError(response, '获取本机号码校验凭证失败'))
      },
      error: (value) => reject(sdkError(toSdkResponse(value), '获取本机号码校验凭证失败')),
    })
  })
}

function toSdkResponse(value: unknown): SdkResponse {
  return value && typeof value === 'object' ? (value as SdkResponse) : {}
}

function sdkError(response: SdkResponse, fallback: string) {
  const code = response.code ? `（${response.code}）` : ''
  return new Error(`${response.msg || fallback}${code}`)
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) return response.data.message
  }

  return error instanceof Error ? error.message : '本机号码校验失败，请稍后重试'
}
</script>

<template>
  <div class="size-full">
    <section class="verify-page scroll-box">
      <main class="content flex flex-col px-48 pt-180">
        <RouterLink class="text-26 text-blue-600" to="/">← 返回一键登录</RouterLink>
        <h1 class="text-48 mt-64 font-semibold text-slate-900">本机号码校验</h1>
        <p class="text-28 mt-20 leading-44 text-slate-500">验证输入手机号是否为当前数据网络使用的号码</p>

        <label class="text-26 mt-64 text-slate-700" for="phone-number">手机号</label>
        <div class="phone-input rounded-20 mt-16 flex h-96 items-center px-28">
          <input
            id="phone-number"
            v-model.trim="phoneNumber"
            class="text-32 size-full text-slate-900 outline-none"
            inputmode="numeric"
            maxlength="11"
            placeholder="请输入需要校验的手机号"
            type="tel"
          />
        </div>

        <label class="text-24 mt-32 flex items-start gap-16 leading-36 text-slate-500">
          <input v-model="agreed" class="mt-4 size-28" type="checkbox" />
          <span>
            我已阅读并同意
            <a v-if="privacyName && privacyUrl" class="text-blue-600" :href="privacyUrl" target="_blank">
              {{ privacyName }}
            </a>
            及号码认证相关协议
          </span>
        </label>

        <button
          class="verify-button rounded-48 text-32 mt-64 h-96 w-full font-medium text-white disabled:opacity-60"
          type="button"
          :disabled="loading"
          @click="verifyPhone"
        >
          {{ loading ? '正在校验' : '验证是否为本机号码' }}
        </button>

        <div
          v-if="result"
          class="result-card rounded-24 text-28 mt-40 p-28 leading-44"
          :class="result.matched ? 'result-pass' : 'result-fail'"
        >
          {{ resultText }}
        </div>

        <p class="text-24 mt-32 leading-38 text-slate-400">请关闭 Wi-Fi，并使用需要校验号码对应的手机数据网络。</p>
      </main>
    </section>
  </div>
</template>

<style scoped>
.verify-page {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 46%);
}

.phone-input {
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.verify-button {
  background: #059669;
  box-shadow: 0 16px 40px rgba(5, 150, 105, 0.22);
}

.verify-button:active {
  background: #047857;
}

.result-card {
  border: 1px solid;
}

.result-pass {
  border-color: #86efac;
  background: #f0fdf4;
  color: #047857;
}

.result-fail {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}
</style>
