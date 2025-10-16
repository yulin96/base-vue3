<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'

const { list } = defineProps<{ list: { key: string | number; value: string }[] }>()

const selectValue = defineModel<string>()

const searchIns = ref({
  value: '',
  show: false,
  list: computed(() => {
    if (searchIns.value.value) {
      return list.filter((item) => item.value.includes(searchIns.value.value))
    } else {
      return list
    }
  }),
})

watch(
  () => searchIns.value.show,
  (nv) => {
    if (!nv) searchIns.value.value = ''
  },
)

const choose = (item: string) => {
  selectValue.value = item
}

onMounted(() => {
  const searchDom = document.querySelector('[data-search-select]')!
  const parent = searchDom.parentElement!

  parent.addEventListener('click', (e) => {
    searchIns.value.show = !searchIns.value.show
  })

  onClickOutside(ref(parent), () => {
    searchIns.value.show = false
  })
})
</script>

<template>
  <transition name="slide-down">
    <div
      v-show="searchIns.show"
      data-search-select
      class="absolute top-full flex h-[600px] w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-lg"
    >
      <van-search v-model="searchIns.value" placeholder="请输入搜索关键词" @click.stop />
      <div class="w-full flex-1 overflow-auto">
        <div v-for="item in searchIns.list" :key="item.key" class="px-[30px] py-[15px]" @click="choose(item.value)">
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
