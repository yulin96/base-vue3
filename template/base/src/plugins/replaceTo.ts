import router from '@/router'
import type { RouteLocationRaw } from 'vue-router'

export const replaceTo = async (to: RouteLocationRaw = '/home') => {
  router.replace(to)
}
