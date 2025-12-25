export function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent)
}

export function isChrome() {
  return /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent)
}

export function isFirefox() {
  return /Firefox/i.test(navigator.userAgent)
}

export function isMobileSafari() {
  return /Mobile.*Safari/i.test(navigator.userAgent)
}

export function isEdge() {
  return /Edg/i.test(navigator.userAgent)
}

export function isIE() {
  return /Trident/i.test(navigator.userAgent) || /MSIE/i.test(navigator.userAgent)
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function getIOSVersion() {
  const match = navigator.userAgent.match(/OS (\d+)_/)
  return match?.[1] ? parseInt(match[1], 10) : null
}

/**
 * 判断是否展示PC模式
 */
export function isPcMode() {
  return !isMobile() || innerWidth > 700
}

/**
 * 判断当前系统是否开启了深色模式
 * @type {boolean} - 如果开启了深色模式则为 true，否则为 false
 */
export const isDarkMode: boolean = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
