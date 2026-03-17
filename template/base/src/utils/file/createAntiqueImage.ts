/**
 * 将图片转换为做旧效果
 * @param file 原始图片文件
 * @param options 图片处理选项
 * @returns 处理后的图片文件
 */
export async function createAntiqueImage(
  file: File,
  options: {
    colorRetention?: number // 色彩保留程度，0-1之间，默认0.6
    brightness?: number // 亮度调整，0-2之间，1为原始亮度，小于1变暗，大于1变亮，默认1
    contrast?: number // 对比度调整，0-2之间，1为原始对比度，默认0.85
    noise?: number // 噪点强度，0-100之间，默认60
    redAdjust?: number // 红色通道调整，正值增加红色，负值减少红色，默认20
    greenAdjust?: number // 绿色通道调整，正值增加绿色，负值减少绿色，默认5
    blueAdjust?: number // 蓝色通道调整，正值增加蓝色，负值减少蓝色，默认-10
  } = {},
): Promise<File> {
  // 设置默认值
  const {
    colorRetention = 0.6,
    brightness = 1,
    contrast = 0.85,
    noise = 60,
    redAdjust = 20,
    greenAdjust = 5,
    blueAdjust = -10,
  } = options

  // 将文件转换为图片对象
  const originalImage = await createImageBitmap(file)

  // 创建canvas绘制图片
  const canvas = document.createElement('canvas')
  canvas.width = originalImage.width
  canvas.height = originalImage.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法获取Canvas 2D上下文')
  }

  // 绘制原始图片
  ctx.drawImage(originalImage, 0, 0)

  // 获取图片数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 应用做旧效果
  for (let i = 0; i < data.length; i += 4) {
    // 获取RGB值
    const r = data[i] ?? 0
    const g = data[i + 1] ?? 0
    const b = data[i + 2] ?? 0

    // 计算加权灰度值，但不完全转换为灰度
    const gray = 0.299 * r + 0.587 * g + 0.114 * b

    // 混合原始色彩和做旧效果
    // colorRetention 控制保留原始颜色的程度，值越高保留的原始色彩越多
    let newR = colorRetention * r + (1 - colorRetention) * gray
    let newG = colorRetention * g + (1 - colorRetention) * gray
    let newB = colorRetention * b + (1 - colorRetention) * gray

    // 应用RGB通道调整，可以实现冷暖色调等效果
    // 预设的复古基础效果
    newR += redAdjust
    newG += greenAdjust
    newB += blueAdjust

    // 应用亮度调整
    newR *= brightness
    newG *= brightness
    newB *= brightness

    // 确保值在0-255范围内
    newR = Math.min(255, Math.max(0, newR))
    newG = Math.min(255, Math.max(0, newG))
    newB = Math.min(255, Math.max(0, newB))

    // 降低对比度，让图像看起来更柔和复古
    const midPoint = 128
    newR = midPoint + (newR - midPoint) * contrast
    newG = midPoint + (newG - midPoint) * contrast
    newB = midPoint + (newB - midPoint) * contrast

    // 添加轻微的噪点效果，模拟胶片颗粒感但不会过度影响颜色
    const noiseValue = (Math.random() - 0.5) * noise
    newR += noiseValue
    newG += noiseValue
    newB += noiseValue

    // 确保值在0-255范围内
    data[i] = Math.min(255, Math.max(0, newR))
    data[i + 1] = Math.min(255, Math.max(0, newG))
    data[i + 2] = Math.min(255, Math.max(0, newB))
  }

  // 将处理后的数据放回canvas
  ctx.putImageData(imageData, 0, 0)

  // 添加轻微的模糊效果
  ctx.filter = 'blur(0.5px)'
  ctx.drawImage(canvas, 0, 0)
  ctx.filter = 'none'

  // 添加晕影效果（边缘变暗）
  addVignette(ctx, canvas.width, canvas.height)

  // 将canvas转换回文件
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        // 保持原始文件名但添加后缀，并保持原始类型
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '_old' + getFileExtension(file.name)
        const newFile = new File([blob], fileName, { type: file.type })
        resolve(newFile)
      } else {
        // 如果转换失败，返回原文件
        resolve(file)
      }
    }, file.type)
  })
}

/**
 * 添加晕影效果（边缘变暗）
 */
function addVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.4, // 内圆
    width / 2,
    height / 2,
    Math.min(width, height) * 0.9, // 外圆
  )

  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.25)')

  // 保存当前状态
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^/.]+$/)
  return match ? match[0] : ''
}
