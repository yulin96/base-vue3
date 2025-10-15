/// <reference types="vite/client" />
/// <reference types="@plugin-web-update-notification/vite" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string
  readonly VITE_APP_LOCALSTORAGE_NAME: string
  readonly VITE_IMAGE_WEBP: string
  readonly VITE_APP_OPENPC: string
  readonly VITE_DROP_CONSOLE: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_HM_BAIDU: string
  readonly VITE_APP_SHARE_TITLE: string
  readonly VITE_APP_SHARE_DESC: string
  readonly VITE_APP_SHARE_LINK: string
  readonly VITE_APP_SHARE_IMGURL: string
  readonly VITE_APP_AUTHOR: string
  readonly VITE_APP_CONTACT: string
  readonly VITE_APP_COMPANY: string
  readonly VITE_APP_COMPANY_LINK: string
}

declare const WeixinJSBridge: any

interface Window {
  IMG_RESOURCES?: string[]
}
