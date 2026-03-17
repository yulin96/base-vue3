import { loadScript } from '@/utils/dom/dom'

const params = new URLSearchParams(window.location.search)

if (params.get('dev') !== null) {
  loadScript('https://oss.eventnet.cn/H5/zz/public/vConsole.js').then(() => {
    //@ts-expect-error window.VConsole
    new window.VConsole()
  })
}
