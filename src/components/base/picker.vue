<script setup lang="ts">
import type { PickerOption } from 'vant'
import { computed, ref } from 'vue'

const show = defineModel<boolean>({ required: true })

const {
  title = '请选择',
  columns,
  search = false,
} = defineProps<{
  title?: string
  columns?: PickerOption[]
  search?: boolean
}>()

const searchValue = ref('')

const emits = defineEmits<{ changeItem: [value: string | number] }>()

const filteredColumns = computed(() => {
  if (!searchValue.value || !columns) return columns
  const keyword = searchValue.value.toLowerCase()
  return columns.filter((i) => i?.text?.toString().toLowerCase().includes(keyword))
})
</script>

<template>
  <van-popup v-model:show="show" position="bottom" round @closed="searchValue = ''">
    <div class="w-full bg-white">
      <van-picker
        :title="title"
        :show-toolbar="true"
        :columns="filteredColumns"
        @cancel="show = false"
        @confirm="
          ({ selectedValues }) => {
            if (selectedValues[0] != null) {
              emits('changeItem', selectedValues[0])
            }
            show = false
          }
        "
      >
        <template #columns-top>
          <van-search v-if="search" v-model="searchValue" placeholder="请输入搜索关键词" />
        </template>
      </van-picker>
    </div>
  </van-popup>
</template>
