/// <reference types="vite/client" />

declare const __ARMSEndpoint: string

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string
  readonly VITE_APP_LOCALSTORAGE_NAME: string
  readonly VITE_APP_MAIN_COLOR: string
  readonly VITE_DROP_CONSOLE: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_HM_BAIDU: string
  readonly VITE_APP_SHARE_TITLE: string
  readonly VITE_APP_SHARE_DESC: string
  readonly VITE_APP_SHARE_LINK: string
  readonly VITE_APP_SHARE_IMGURL: string
  readonly VITE_APP_AUTHOR: string
  readonly VITE_APP_CONTACT: string
  readonly VITE_APP_ARMS: string
  readonly VITE_APP_APPID: string
  readonly VITE_APP_APPSECRET: string
}

declare const WeixinJSBridge: any

interface Window {
  IMG_RESOURCES?: string[]
  RumSDK?: any
}
