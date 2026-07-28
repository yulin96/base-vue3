<script setup lang="ts">
import { useWanImageRequest } from '@/api/wan-image'
import { failToast } from '@/plugins/vant/toast'
import { compressPhoto } from '@/utils/file/compressImage'
import { isAxiosError } from 'axios'
import { onBeforeUnmount, ref } from 'vue'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

const uploadInput = ref<HTMLInputElement>()
const cameraInput = ref<HTMLInputElement>()
const resultInput = ref<HTMLInputElement>()
const selectedFile = ref<File>()
const previewUrl = ref('')
const resultUrl = ref('')
const resultObjectUrl = ref('')
const errorMessage = ref('')
const compressing = ref(false)
const { generate, loading } = useWanImageRequest()

const openUpload = () => uploadInput.value?.click()
const openCamera = () => cameraInput.value?.click()
const openResultUpload = () => resultInput.value?.click()

const clearResultObjectUrl = () => {
  if (!resultObjectUrl.value) return

  URL.revokeObjectURL(resultObjectUrl.value)
  resultObjectUrl.value = ''
}

const selectResultImage = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    failToast('请选择图片文件')
    return
  }

  clearResultObjectUrl()
  resultObjectUrl.value = URL.createObjectURL(file)
  resultUrl.value = resultObjectUrl.value
  errorMessage.value = ''
}

const selectImage = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(file.type)) {
    failToast('请选择 JPG、PNG、WEBP 或 BMP 图片')
    return
  }

  compressing.value = true

  try {
    const compressed = await compressPhoto(file, {
      maxWidth: 1024,
      maxHeight: 1024,
    })

    console.log(compressed.size)

    if (compressed.size > 20 * 1024 * 1024) {
      failToast('图片压缩后仍超过 20 MB')
      return
    }

    const compressedFile = new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: file.lastModified,
    })

    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

    selectedFile.value = compressedFile
    previewUrl.value = URL.createObjectURL(compressedFile)
    clearResultObjectUrl()
    resultUrl.value = ''
    errorMessage.value = ''
  } catch (error) {
    failToast(error instanceof Error ? error.message : '图片压缩失败')
  } finally {
    compressing.value = false
  }
}

const generateImage = async () => {
  if (!selectedFile.value || loading.value) return

  errorMessage.value = ''
  clearResultObjectUrl()
  resultUrl.value = ''

  try {
    const response = await generate(selectedFile.value)
    const imageUrl = response.data?.images?.[0]

    if (!imageUrl) throw new Error('接口未返回生成图片')
    resultUrl.value = imageUrl
  } catch (error) {
    const responseMessage = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message
      : undefined

    errorMessage.value = responseMessage || (error instanceof Error ? error.message : '生成失败，请稍后重试')
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  clearResultObjectUrl()
})
</script>

<template>
  <div class="size-full bg-[#f4f1eb] text-[#20201d]">
    <section class="scroll-box index min-h-screen overflow-y-auto bg-transparent">
      <main class="page-shell mx-auto flex min-h-screen w-full flex-col px-32 pt-20">
        <section class="rounded-32 mt-10 bg-white p-16 shadow-[0_18px_55px_rgba(67,52,39,0.09)]">
          <div class="rounded-24 relative aspect-square w-full overflow-hidden bg-[#ece8e0]">
            <img v-if="previewUrl" :src="previewUrl" class="size-full object-cover" alt="用户上传图片预览" />

            <button
              v-else
              type="button"
              class="flex size-full flex-col items-center justify-center gap-16 text-[#827b70]"
              @click="openUpload"
            >
              <span class="center size-84 rounded-full bg-white shadow-[0_10px_30px_rgba(67,52,39,0.1)]">
                <svg viewBox="0 0 24 24" class="size-36 fill-none stroke-current stroke-2" aria-hidden="true">
                  <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
                </svg>
              </span>
              <span class="text-24 font-medium">选择一张人物照片</span>
            </button>

            <div
              v-if="loading || compressing"
              class="absolute inset-0 flex flex-col items-center justify-center bg-[#201d19]/78 text-white"
            >
              <span class="size-48 animate-spin rounded-full border-4 border-white/25 border-t-white"></span>
              <p class="text-25 mt-20 font-medium">
                {{ compressing ? '正在压缩图片' : 'AI 正在生成' }}
              </p>
              <p class="text-20 mt-8 text-white/65">
                {{ compressing ? '优化上传大小，请稍候' : '通常需要十秒左右，请不要关闭页面' }}
              </p>
            </div>
          </div>

          <div class="mt-16 grid grid-cols-2 gap-14">
            <button
              type="button"
              class="rounded-22 text-24 h-86 bg-[#f0ede7] font-medium text-[#4d4943] active:scale-[0.98]"
              :disabled="loading || compressing"
              @click="openUpload"
            >
              相册选择
            </button>
            <button
              type="button"
              class="rounded-22 text-24 h-86 bg-[#f0ede7] font-medium text-[#4d4943] active:scale-[0.98]"
              :disabled="loading || compressing"
              @click="openCamera"
            >
              拍照上传
            </button>
          </div>

          <input
            ref="uploadInput"
            class="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp"
            @change="selectImage"
          />
          <input ref="cameraInput" class="hidden" type="file" accept="image/*" capture="user" @change="selectImage" />
        </section>

        <button
          type="button"
          class="rounded-26 text-26 mt-24 h-96 w-full bg-[#20201d] font-semibold text-white shadow-[0_16px_30px_rgba(32,32,29,0.18)] active:scale-[0.99] disabled:bg-[#b9b4aa] disabled:shadow-none"
          :disabled="!selectedFile || loading || compressing"
          @click="generateImage"
        >
          {{ loading ? '正在生成…' : '开始生成' }}
        </button>

        <button
          type="button"
          class="rounded-26 text-24 mt-16 h-82 w-full border-2 border-[#b9b4aa] bg-white/70 font-medium text-[#4d4943] active:scale-[0.99] disabled:opacity-50"
          :disabled="loading || compressing"
          @click="openResultUpload"
        >
          上传结果图
        </button>
        <input ref="resultInput" class="hidden" type="file" accept="image/*" @change="selectResultImage" />

        <p v-if="errorMessage" class="rounded-20 text-22 mt-20 bg-[#fff0ee] px-20 py-18 leading-[1.5] text-[#ad3e32]">
          {{ errorMessage }}
        </p>

        <section v-if="resultUrl" class="mt-40 pb-20">
          <div class="mb-16 flex items-end justify-between">
            <div>
              <p class="text-22 font-semibold tracking-[0.12em] text-[#8b6748]">AI RESULT</p>
              <h2 class="text-34 mt-8 font-semibold">生成结果</h2>
            </div>
            <a :href="resultUrl" target="_blank" rel="noopener noreferrer" class="text-22 font-medium text-[#8b6748]"
              >查看原图</a
            >
          </div>

          <div
            class="rounded-30 center relative h-660 w-full overflow-hidden bg-white shadow-[0_18px_55px_rgba(67,52,39,0.09)]"
          >
            <!--  -->
            <img
              class="absolute bottom-30 z-20 -ml-2 w-700"
              src="https://oss.eventnet.cn/mm/temp/da38485504982be7f4fe460376b9f08d.png"
            />
            <div class="absolute bottom-380 z-10 w-230">
              <img :src="resultUrl" class="rounded-22 w-full object-contain" alt="AI 生成结果" />
            </div>
          </div>
          <p class="text-20 mt-16 text-center leading-[1.5] text-[#8a857c]">
            生成图片链接有效期有限，请及时打开原图保存。
          </p>
        </section>
      </main>
    </section>
  </div>
</template>

<style scoped>
.page-shell {
  padding-bottom: max(48px, env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 88% 6%, rgb(209 178 142 / 28%), transparent 24%),
    radial-gradient(circle at 3% 38%, rgb(255 255 255 / 70%), transparent 22%);
}

button {
  transition:
    transform 160ms ease,
    background-color 160ms ease;
}
</style>
