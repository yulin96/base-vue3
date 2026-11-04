<script setup lang="ts">
import { useGsapContext } from '@/hooks/animation/useGsapContext'
import { createContactVCard, createRandomContact, type ContactInfo } from '@/utils/contact'
import { focusDom } from '@/utils/dom/focus'
import {
  LucideArrowDownToLine as ArrowDownToLine,
  LucideShuffle as Shuffle,
  LucideSmartphone as Smartphone,
} from '@lucide/vue'
import { onMounted, reactive, ref } from 'vue'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

useGsapContext('.index', () => {})
onMounted(() => {
  document.title = '联系人名片'
})

const emptyContact: ContactInfo = { name: '', phone: '', email: '', company: '', title: '' }
const contact = reactive({ ...emptyContact })
const feedback = reactive({ error: '', field: '', downloadStarted: false, random: false })
const exporting = ref(false)
const fields = [
  {
    key: 'name',
    label: '姓名',
    placeholder: '请输入姓名',
    autocomplete: 'name',
    type: 'text',
    maxlength: 80,
    required: true,
  },
  {
    key: 'phone',
    label: '手机号',
    placeholder: '请输入 11 位手机号',
    autocomplete: 'tel-national',
    type: 'tel',
    maxlength: 11,
    required: true,
  },
  { key: 'email', label: '邮箱', placeholder: '选填', autocomplete: 'email', type: 'email', maxlength: 254 },
  { key: 'company', label: '公司', placeholder: '选填', autocomplete: 'organization', type: 'text', maxlength: 120 },
  { key: 'title', label: '职位', placeholder: '选填', autocomplete: 'organization-title', type: 'text', maxlength: 80 },
] as const

function resetFeedback() {
  Object.assign(feedback, { error: '', field: '', downloadStarted: false, random: false })
}

function fillRandom() {
  if (exporting.value) return
  Object.assign(contact, createRandomContact())
  resetFeedback()
  feedback.random = true
}

function clearContact() {
  if (exporting.value) return
  Object.assign(contact, emptyContact)
  resetFeedback()
}

function saveContact() {
  if (exporting.value) return
  feedback.downloadStarted = false
  feedback.error = ''
  feedback.field = ''

  for (const field of fields) contact[field.key] = contact[field.key].trim()
  if (!contact.name) {
    feedback.field = 'name'
    feedback.error = '请填写联系人姓名'
  } else if (!/^1[3-9]\d{9}$/.test(contact.phone)) {
    feedback.field = 'phone'
    feedback.error = '请输入正确的 11 位手机号'
  } else if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    feedback.field = 'email'
    feedback.error = '邮箱格式不正确，请检查后重试'
  }

  if (feedback.field) {
    focusDom(`contact-${feedback.field}`)
    document.getElementById(`contact-${feedback.field}`)?.focus()
    return
  }

  exporting.value = true
  try {
    const blob = new Blob([createContactVCard(contact)], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${contact.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')}.vcf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    feedback.downloadStarted = true
  } catch {
    feedback.error = '联系人文件生成失败，请重新尝试保存'
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index bg-[#f4f5f2] text-[#203c35]">
      <main class="content px-40 pt-48 pb-48">
        <div class="mb-18 flex items-center justify-between">
          <h1 class="text-30 font-semibold">联系人信息</h1>
          <div
            btn
            ig
            role="button"
            :aria-disabled="exporting"
            class="text-28 flex min-h-72 items-center gap-10 px-8 font-medium text-[#315e4b]"
            @click="fillRandom"
          >
            <Shuffle class="size-30" :stroke-width="1.8" aria-hidden="true" />
            随机填充
          </div>
        </div>

        <div class="rounded-24 bg-white px-28">
          <div
            v-for="field in fields"
            :key="field.key"
            :class="[
              'flex min-h-104 items-center gap-20 border-b border-[#ebeeea] last:border-b-0 focus-within:border-[#48745c]',
              { 'text-[#b33535]': feedback.field === field.key },
            ]"
            :contact-name="field.key === 'name' ? '' : undefined"
            :contact-phone="field.key === 'phone' ? '' : undefined"
            :contact-email="field.key === 'email' ? '' : undefined"
          >
            <label :for="`contact-${field.key}`" class="text-28 w-100 shrink-0 font-medium">{{ field.label }}</label>
            <input
              :id="`contact-${field.key}`"
              v-model.trim="contact[field.key]"
              :type="field.type"
              :maxlength="field.maxlength"
              :autocomplete="field.autocomplete"
              :placeholder="field.placeholder"
              :required="'required' in field && field.required"
              :aria-invalid="feedback.field === field.key"
              :aria-describedby="feedback.field === field.key ? 'contact-error' : undefined"
              class="text-32 h-100 w-full leading-normal text-[#203c35]"
              @input="resetFeedback"
            />
          </div>
        </div>

        <p v-if="feedback.error" id="contact-error" role="alert" class="text-26 mt-18 leading-relaxed text-[#b33535]">
          {{ feedback.error }}
        </p>
        <p v-if="feedback.random" role="status" class="text-24 mt-18 leading-relaxed text-[#64736c]">
          已填充随机测试信息，可继续编辑。手机号为演示数据，请勿拨打。
        </p>

        <div class="mt-32 flex gap-16">
          <div
            btn
            role="button"
            :aria-disabled="exporting"
            class="center rounded-20 text-30 min-h-100 flex-1 gap-14 bg-[#284f40] px-20 font-medium text-white active:bg-[#1f3f33]"
            @click="saveContact"
          >
            <ArrowDownToLine class="size-34" :stroke-width="1.8" aria-hidden="true" />
            {{ exporting ? '正在生成…' : '保存到通讯录' }}
          </div>
          <div
            btn
            role="button"
            :aria-disabled="exporting"
            class="center rounded-20 text-28 min-h-100 w-132 shrink-0 bg-[#e6eae3] text-[#405849] active:bg-[#dce2d7]"
            @click="clearContact"
          >
            清空
          </div>
        </div>

        <section v-if="feedback.downloadStarted" role="status" class="rounded-20 mt-24 bg-[#e4eddf] p-24">
          <h2 class="text-28 font-semibold">已发起联系人文件下载</h2>
          <p class="text-26 mt-12 leading-relaxed text-[#405849]">
            打开下载的 .vcf 文件，在手机上确认添加联系人。若未弹出导入界面，请在浏览器下载列表或「文件」中打开。
          </p>
        </section>

        <aside class="text-24 mt-32 flex items-start gap-14 leading-relaxed text-[#64736c]">
          <Smartphone class="mt-4 size-28 shrink-0" :stroke-width="1.7" aria-hidden="true" />
          <div>
            <p>保存后需在手机上确认导入。微信等内置浏览器若无法下载，请在 Safari 或系统浏览器中打开。</p>
            <p class="mt-12">填写内容仅用于本次生成，刷新页面即清空。</p>
          </div>
        </aside>
      </main>
    </section>
  </div>
</template>
