<script setup lang="ts">
import { useGsapContext } from '@/hooks/animation/useGsapContext'
import { compressPhoto } from '@/utils/file/compressImage'
import { computed, ref } from 'vue'

type CompressionResult = {
  fileName: string
  originalSize: number
  compressedSize?: number
  status: 'success' | 'failure' | 'empty'
  message: string
}

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

const fileInput = ref<HTMLInputElement>()
const isCompressing = ref(false)
const results = ref<CompressionResult[]>([])
const resultCounts = computed(() => ({
  success: results.value.filter((item) => item.status === 'success').length,
  failure: results.value.filter((item) => item.status === 'failure').length,
  empty: results.value.filter((item) => item.status === 'empty').length,
}))
const sortedResults = computed(() => [
  ...results.value.filter((item) => item.status !== 'success'),
  ...results.value.filter((item) => item.status === 'success'),
])

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})

function selectPhotos() {
  if (!fileInput.value || isCompressing.value) return
  fileInput.value.value = ''
  fileInput.value.click()
}

async function handlePhotosSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length === 0) return

  isCompressing.value = true
  results.value = []

  for (const file of files) {
    try {
      const compressedFile = await compressPhoto(file)

      if (!compressedFile || compressedFile.size === 0) {
        results.value.push({
          fileName: file.name,
          originalSize: file.size,
          status: 'empty',
          message: '压缩成功，但返回结果为空',
        })
        continue
      }

      results.value.push({
        fileName: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        status: 'success',
        message: '压缩成功',
      })
    } catch (error) {
      results.value.push({
        fileName: file.name,
        originalSize: file.size,
        status: 'failure',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  isCompressing.value = false
}

function formatFileSize(size: number) {
  return `${(size / 1024).toFixed(2)} KB`
}
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content p-32">
        <h1 class="text-36 font-bold">多图压缩测试</h1>
        <p class="text-26 mt-16 text-gray-500">选择多张图片后，将按顺序逐张调用 compressPhoto。</p>

        <div class="mt-24 grid grid-cols-3 gap-16 text-center">
          <div class="rounded-16 bg-green-50 p-20 text-green-600">
            <div class="text-24">成功</div>
            <div class="text-36 mt-8 font-bold">{{ resultCounts.success }}</div>
          </div>
          <div class="rounded-16 bg-red-50 p-20 text-red-600">
            <div class="text-24">失败</div>
            <div class="text-36 mt-8 font-bold">{{ resultCounts.failure }}</div>
          </div>
          <div class="rounded-16 bg-orange-50 p-20 text-orange-500">
            <div class="text-24">空</div>
            <div class="text-36 mt-8 font-bold">{{ resultCounts.empty }}</div>
          </div>
        </div>

        <input ref="fileInput" class="hidden" type="file" accept="image/*" multiple @change="handlePhotosSelected" />

        <button
          class="rounded-16 text-28 mt-32 h-88 w-full bg-black text-white disabled:opacity-50"
          type="button"
          :disabled="isCompressing"
          @click="selectPhotos"
        >
          {{ isCompressing ? '压缩中...' : '选择多张图片' }}
        </button>

        <ul v-if="results.length" class="mt-32 space-y-20">
          <li
            v-for="(item, index) in sortedResults"
            :key="`${item.fileName}-${index}`"
            class="rounded-16 text-24 border-2 p-24"
            :class="{
              'border-red-500 bg-red-50': item.status === 'failure',
              'border-orange-400 bg-orange-50': item.status === 'empty',
              'border-transparent bg-gray-100': item.status === 'success',
            }"
          >
            <div class="font-bold break-all">{{ item.fileName }}</div>
            <div class="mt-12">原始大小：{{ formatFileSize(item.originalSize) }}</div>
            <div v-if="item.compressedSize !== undefined" class="mt-8">
              压缩大小：{{ formatFileSize(item.compressedSize) }}
            </div>
            <div
              class="mt-8 font-bold"
              :class="{
                'text-green-600': item.status === 'success',
                'text-red-600': item.status === 'failure',
                'text-orange-500': item.status === 'empty',
              }"
            >
              {{ item.status }}：{{ item.message }}
            </div>
          </li>
        </ul>
      </main>
    </section>
  </div>
</template>
