function userAgent() {
  return navigator.userAgent || ''
}

export function isWeChat() {
  return /MicroMessenger/i.test(userAgent())
}

export function isChrome() {
  return /Chrome/i.test(userAgent()) && !/Edg/i.test(userAgent())
}

export function isFirefox() {
  return /Firefox/i.test(userAgent())
}

export function isMobileSafari() {
  return /Mobile.*Safari/i.test(userAgent())
}

export function isEdge() {
  return /Edg/i.test(userAgent())
}

export function isIE() {
  return /Trident/i.test(userAgent()) || /MSIE/i.test(userAgent())
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent())
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(userAgent())
}

export function getIOSVersion() {
  const match = userAgent().match(/OS (\d+)_/)
  return match ? parseInt(match[1], 10) : null
}
