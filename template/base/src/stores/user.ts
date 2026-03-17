import { defineStore } from 'pinia'
import { ref } from 'vue'

type IWxInfo = {
  openid: string
  nickname: string
  avatar: string
}

export const useStore = defineStore(
  'user',
  () => {
    const createInitialState = () => ({
      code: '',

      info: {} as Partial<Record<string, unknown>>,
      wxInfo: {} as Partial<IWxInfo>,

      backXY: { x: 0, y: 0 },

      other: {} as Partial<Record<string, unknown>>,
      ignore: {} as Partial<Record<string, unknown>>,
    })

    const user = ref({
      ...createInitialState(),
      clear() {
        Object.assign(this, createInitialState())
      },
    })

    return { user }
  },
  {
    persist: {
      key: import.meta.env.VITE_APP_LOCALSTORAGE_NAME || 'test',
      omit: ['user.ignore'],
    },
  },
)
