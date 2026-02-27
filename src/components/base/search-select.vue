<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'

const { list } = defineProps<{ list: { key: string | number; value: string }[] }>()

const selectValue = defineModel<string>()

const panelRef = useTemplateRef<HTMLElement>('panelRef')

const keyword = ref('')
const show = ref(false)
const filteredList = computed(() => {
  if (!keyword.value) return list
  return list.filter((item) => item.value.includes(keyword.value))
})

watch(
  show,
  (nv) => {
    if (!nv) keyword.value = ''
  },
)

const choose = (item: string) => {
  selectValue.value = item
  show.value = false
}

onMounted(() => {
  const parent = panelRef.value?.parentElement
  if (!parent) return

  useEventListener(parent, 'click', () => {
    show.value = !show.value
  })

  onClickOutside(parent, () => {
    show.value = false
  })
})
</script>

<template>
  <transition name="slide-down">
    <div
      ref="panelRef"
      v-show="show"
      data-search-select
      class="absolute top-full flex h-600 w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-lg"
      @click.stop
    >
      <van-search v-model="keyword" placeholder="请输入搜索关键词" @click.stop />
      <div class="w-full flex-1 overflow-auto">
        <div v-for="item in filteredList" :key="item.key" class="px-30 py-15" @click="choose(item.value)">
          {{ item.value }}
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    opacity 0.26s ease,
    transform 0.26s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-60px);
}
</style>
