import { isWeChat } from '@/utils/platform/ua'
import axios, { toFormData } from 'axios'

let wxSdkPromise: Promise<any> | null = null
const loadWechatSdk = async (): Promise<typeof import('weixin-js-sdk').default> => {
  if (!wxSdkPromise) {
    wxSdkPromise = import('weixin-js-sdk')
      .then((mod) => ('default' in mod ? mod.default : mod))
      .catch((error) => {
        wxSdkPromise = null
        throw error
      })
  }
  return wxSdkPromise
}

let wxConfigIsReady = false
let wxConfigPromise: Promise<void> | null = null

async function applyWechatSdkConfig(data: any, debug = false): Promise<void> {
  const wx = await loadWechatSdk()

  return new Promise((resolve, reject) => {
    wx.config({
      debug,
      appId: data.appId,
      timestamp: data.timestamp,
      nonceStr: data.nonceStr,
      signature: data.signature,
      jsApiList: [
        'scanQRCode',
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'openLocation',
        'previewImage',
        'hideAllNonBaseMenuItem',
        'closeWindow',
        'hideMenuItems',
        'hideOptionMenu',
      ],
      openTagList: ['wx-open-launch-app', 'wx-open-launch-weapp'],
    })

    wx.ready(() => {
      resolve()
      wxConfigIsReady = true
      wxConfigPromise = null
    })

    wx.error((res) => {
      reject(res?.errMsg || '微信 JSSDK 配置失败')
    })
  })
}

export async function ensureWechatSdkReady() {
  if (wxConfigIsReady) return
  if (wxConfigPromise) return wxConfigPromise

  const url = location.href.split('#')[0]
  if (!url) throw new Error('无法获取页面URL')

  wxConfigPromise = (async () => {
    try {
      const { data } = await axios.post(
        'https://wechat.event1.cn/api/getJsSdk',
        toFormData({
          url,
          name: 'hudongweipingtai',
        }),
      )

      await applyWechatSdkConfig(data?.data ?? {})
    } catch (error) {
      wxConfigPromise = null
      throw error
    }
  })()

  return wxConfigPromise
}

/** @deprecated 请使用 ensureWechatSdkReady */
export const getWechatConfig = ensureWechatSdkReady

export type IWxShare = {
  title?: string
  desc?: string
  link?: string
  imgUrl?: string
}

export async function wechatShare(data: IWxShare) {
  const { title, desc, link, imgUrl } = data

  try {
    await ensureWechatSdkReady()
    const wx = await loadWechatSdk()

    return await new Promise<boolean>((resolve) => {
      wx.updateAppMessageShareData({
        title: title || document.title,
        desc: desc || document.title,
        link: link || location.href.split('#')[0] || '',
        imgUrl: imgUrl || '',
        success() {
          resolve(true)
        },
        fail() {
          resolve(false)
        },
      })

      wx.updateTimelineShareData({
        title: title || document.title,
        link: link || location.href.split('#')[0] || '',
        imgUrl: imgUrl || '',
        success() {
          resolve(true)
        },
        fail() {
          resolve(false)
        },
      })
    })
  } catch (err) {
    console.log(err)
    return false
  }
}

export async function wechatScan(): Promise<string | void> {
  await ensureWechatSdkReady()
  const wx = await loadWechatSdk()

  return await new Promise<string>((resolve) => {
    wx.scanQRCode({
      needResult: 1,
      scanType: ['qrCode', 'barCode'],
      success(res: { resultStr: string; scan_code: { scan_result: string } }) {
        resolve(res?.resultStr || res?.scan_code?.scan_result || '')
      },
      fail() {
        resolve('')
      },
      cancel() {
        resolve('')
      },
    })
  })
}

type IWxOpenLocation = {
  latitude: number
  longitude: number
  name: string
  address: string
  scale?: number
  infoUrl?: string
}

let openLocationLock = false
/**
 * @example
 * wxOpenLocation({
 *  latitude: 0,
 *  longitude: 0,
 *  name: '',
 *  address: '',
 * })
 */
export function wechatOpenLocation(data: IWxOpenLocation): void {
  if (openLocationLock) return
  openLocationLock = true
  const { latitude, longitude, name, address, scale = 20, infoUrl = '' } = data

  void (async () => {
    try {
      await ensureWechatSdkReady()
      const wx = await loadWechatSdk()
      wx.openLocation({
        latitude,
        longitude,
        name,
        address,
        scale,
        infoUrl,
        complete: () => {
          openLocationLock = false
        },
      })
    } catch (err) {
      console.log(err)
      openLocationLock = false
    }
  })()
}

export function wechatPreviewImage(current: string, urls: string[], onFail?: () => void): void {
  void (async () => {
    try {
      await ensureWechatSdkReady()
      const wx = await loadWechatSdk()
      wx.previewImage({
        current,
        urls,
        fail() {
          onFail?.()
        },
      })
    } catch (err) {
      console.log(err)
      onFail?.()
    }
  })()
}

export function wechatHideAllNonBaseMenuItem() {
  void (async () => {
    await ensureWechatSdkReady()
    const wx = await loadWechatSdk()
    wx.hideAllNonBaseMenuItem()
  })()
}

export function closeWindow() {
  isWeChat()
    ? void (async () => {
        await ensureWechatSdkReady()
        const wx = await loadWechatSdk()
        wx.closeWindow()
      })()
    : window.close()
}

export function wechatDisableTimeline() {
  if (isWeChat()) {
    void (async () => {
      await ensureWechatSdkReady()
      const wx = await loadWechatSdk()
      wx.hideMenuItems({
        menuList: ['menuItem:share:QZone', 'menuItem:share:timeline'],
      })
    })()
  } else {
    console.error('disableTimeline: not in wechat')
  }
}
