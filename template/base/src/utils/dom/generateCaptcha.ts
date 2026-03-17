/**
 * 生成图像验证码并将其绘制在指定的 div 元素中。
 *
 * @param captchaDiv - 用于绘制验证码的 div 元素。
 * @returns 生成的验证码内容。
 */

interface GenerateCaptchaOptions {
  captchaDiv?: HTMLDivElement | null
  captchaLength?: number
  padding?: number
  fontSize?: number
}

export function generateCaptcha(option: GenerateCaptchaOptions) {
  const { captchaDiv, captchaLength = 5, padding = 10, fontSize = 20 } = option

  if (!captchaDiv) {
    console.error(`Element not found`)
    return
  }

  // 获取目标div的宽高
  const width = captchaDiv.offsetWidth
  const height = captchaDiv.offsetHeight

  if (width === 0 || height === 0) {
    console.error('Target div has no width or height. Please set dimensions for the div.')
    return
  }

  // 获取 devicePixelRatio
  const dpr = window.devicePixelRatio || 1

  // 创建canvas元素并设置宽高（考虑 devicePixelRatio）
  const canvas = document.createElement('canvas')
  canvas.width = width * dpr // 实际画布宽度根据dpr缩放
  canvas.height = height * dpr // 实际画布高度根据dpr缩放
  canvas.style.width = `${width}px` // CSS宽度保持不变
  canvas.style.height = `${height}px` // CSS高度保持不变

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('Unable to create canvas context')
    return
  }

  // 按照 dpr 缩放画布内容
  ctx.scale(dpr, dpr)

  // 生成随机验证码内容
  const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ23456789'
  let captchaText = ''

  for (let i = 0; i < captchaLength; i++) {
    captchaText += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  // 绘制干扰线条
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)},${Math.random()})`
    ctx.lineWidth = Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(Math.random() * width, Math.random() * height)
    ctx.lineTo(Math.random() * width, Math.random() * height)
    ctx.stroke()
  }

  // 设置字体
  ctx.font = `${fontSize}px Arial`
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  // 每个字符独立绘制，并添加随机倾斜
  const charSpacing = (width - padding * 2) / captchaLength // 每个字符之间的间距
  for (let i = 0; i < captchaText.length; i++) {
    const char = captchaText[i]
    const x = padding + charSpacing * (i + 0.5)
    const y = height / 2

    // 保存上下文状态
    ctx.save()

    // 随机倾斜角度（范围 -30 到 30 度）
    const skewAngle = ((Math.random() * 60 - 30) * Math.PI) / 180

    // 平移到字符位置后再应用旋转
    ctx.translate(x, y)
    ctx.rotate(skewAngle)

    // 绘制字符
    if (char) {
      ctx.fillText(char, 0, 0)
    }

    // 恢复上下文状态
    ctx.restore()
  }

  // 清空目标div，并将canvas添加进去
  captchaDiv.innerHTML = ''
  captchaDiv.appendChild(canvas)

  // 返回验证码内容，方便后续验证
  return captchaText
}
