const weixinJSBridge = window.WeixinJSBridge as WeixinJSBridgeApi | undefined

if (weixinJSBridge && typeof weixinJSBridge.invoke === 'function') {
  handleFontSize()
} else {
  document.addEventListener('WeixinJSBridgeReady', handleFontSize, false)
}

function handleFontSize() {
  const bridge = window.WeixinJSBridge as WeixinJSBridgeApi | undefined
  if (!bridge) return

  // 设置网页字体为默认大小
  bridge.invoke('setFontSizeCallback', { fontSize: 0 })
  // 重写设置网页字体大小的事件
  bridge.on('menu:setfont', function () {
    bridge.invoke('setFontSizeCallback', { fontSize: 0 })
  })
}
