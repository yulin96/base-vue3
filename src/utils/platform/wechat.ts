import { isWeChat } from '@/utils/platform/ua'
import axios, { toFormData } from 'axios'

let wxSdkPromise: Promise<any> | null = null
const loadWechatSdk = async () => {
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
  if (wxConfigIsReady) return Promise.resolve()
  if (wxConfigPromise) return wxConfigPromise

  const url = location.href.split('#')[0]
  if (!url) return Promise.reject(new Error('无法获取页面URL'))

  wxConfigPromise = axios
    .post(
      'https://wechat.event1.cn/api/getJsSdk',
      toFormData({
        url,
        name: 'hudongweipingtai',
      }),
    )
    .then(({ data }) => applyWechatSdkConfig(data?.data ?? {}))
    .catch((error) => {
      wxConfigPromise = null
      return Promise.reject(error)
    })

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

export function wechatShare(data: IWxShare) {
  return new Promise<boolean>((resolve, reject) => {
    const { title, desc, link, imgUrl } = data

    ensureWechatSdkReady()
      .then(async () => {
        const wx = await loadWechatSdk()
        wx.updateAppMessageShareData({
          title,
          desc,
          link: link || location.href.split('#')[0] || '',
          imgUrl,
          success() {
            resolve(true)
          },
          fail() {
            resolve(false)
          },
        })
        wx.updateTimelineShareData({
          title,
          link: link || location.href.split('#')[0] || '',
          imgUrl,
          success() {
            resolve(true)
          },
          fail() {
            resolve(false)
          },
        })
      })
      .catch((err) => {
        resolve(false)
        console.log(err)
      })
  })
}

export function wechatScan(): Promise<string | void> {
  return new Promise<string>((resolve, reject) => {
    ensureWechatSdkReady()
      .then(async () => {
        const wx = await loadWechatSdk()
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
      .catch((err) => {
        reject(err)
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
  ensureWechatSdkReady()
    .then(async () => {
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
    })
    .catch((err) => {
      console.log(err)
      openLocationLock = false
    })
}

export function wechatPreviewImage(current: string, urls: string[]): void {
  ensureWechatSdkReady()
    .then(async () => {
      const wx = await loadWechatSdk()
      wx.previewImage({ current, urls })
    })
    .catch((err) => {
      console.log(err)
    })
}

export function wechatHideAllNonBaseMenuItem() {
  ensureWechatSdkReady().then(async () => {
    const wx = await loadWechatSdk()
    wx.hideAllNonBaseMenuItem()
  })
}

export function closeWindow() {
  isWeChat()
    ? ensureWechatSdkReady().then(async () => {
        const wx = await loadWechatSdk()
        wx.closeWindow()
      })
    : window.close()
}

export function wechatDisableTimeline() {
  if (isWeChat()) {
    ensureWechatSdkReady().then(async () => {
      const wx = await loadWechatSdk()
      wx.hideMenuItems({
        menuList: ['menuItem:share:QZone', 'menuItem:share:timeline'],
      })
    })
  } else {
    console.error('disableTimeline: not in wechat')
  }
}
