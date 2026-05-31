import { useLocalStorage } from '@vueuse/core'
import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhCN from './zh-CN.json'

export type MessageSchema = typeof zhCN

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}

const { VITE_APP_LOCALSTORAGE_NAME: localName } = import.meta.env
const localeName = useLocalStorage<'zh-CN' | 'en'>(
  `${localName || 'test'}-local`,
  navigator.language?.includes('en') ? 'en' : 'zh-CN',
)

const i18n = createI18n({
  inheritLocale: true,
  legacy: false,
  locale: localeName.value,
  messages: {
    'zh-CN': zhCN,
    en: en,
  },
})

export const setLocale = (locale: 'zh-CN' | 'en') => {
  i18n.global.locale.value = locale
}

watch(
  () => i18n.global.locale.value,
  (value) => {
    localeName.value = value
  },
)

export default i18n
