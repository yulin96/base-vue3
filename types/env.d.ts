/// <reference types="vite/client" />

export {}

declare global {
  const __ARMSEndpoint: string

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

  interface WeixinJSBridgeApi {
    invoke(method: string, params: Record<string, unknown>): void
    on(event: string, callback: () => void): void
  }

  interface ArmsRumClient {
    sendException(payload: {
      name: string
      message: string
      file?: string
      stack?: string
      line?: number
      column?: number
      properties?: Record<string, string | number>
    }): void
  }

  interface NetworkConnectionInfo {
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | (string & {})
    downlink?: number
    rtt?: number
    saveData?: boolean
    type?: string
  }

  interface Navigator {
    connection?: NetworkConnectionInfo
    mozConnection?: NetworkConnectionInfo
    webkitConnection?: NetworkConnectionInfo
  }

  interface Window {
    IMG_RESOURCES?: string[]
    RumSDK?: { default?: ArmsRumClient }
    __rum?: unknown
    _hmt?: { push(command: [name: string, ...args: unknown[]]): unknown }
    _webpSupport?: boolean
  }
}
