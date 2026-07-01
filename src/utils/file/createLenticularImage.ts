export type LenticularImageSource = string | HTMLImageElement

export interface CreateLenticularImageOptions {
  width?: number
  height?: number
  stripWidth?: number
  type?: 'image/png' | 'image/jpeg' | 'image/webp'
  quality?: number
  fileName?: string
  backgroundColor?: string
}

/**
 * 创建光栅画：把多张图片按竖向条纹交错合成为一张图。
 */
export async function createLenticularImage(
  sources: LenticularImageSource[],
  options: CreateLenticularImageOptions = {},
): Promise<File> {
  if (sources.length < 2) {
    throw new Error('至少需要传入两张图像')
  }

  const images = await Promise.all(sources.map(sourceToImage))
  const { width = images[0]?.naturalWidth || 0, height = images[0]?.naturalHeight || 0 } = options

  if (!width || !height) {
    throw new Error('图像尺寸无效')
  }

  const { stripWidth = 8, type = 'image/png', quality = 0.92, fileName = 'lenticular.png', backgroundColor } = options
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法获取Canvas 2D上下文')
  }

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }

  const strip = Math.max(1, Math.floor(stripWidth))

  ctx.drawImage(images[0], 0, 0, width, height)

  for (let x = strip; x < width; x += strip * images.length) {
    for (let index = 1; index < images.length; index++) {
      const stripX = x + strip * (index - 1)
      const currentStripWidth = Math.min(strip, width - stripX)

      if (currentStripWidth > 0) {
        const img = images[index]
        const scaleX = img.naturalWidth / width
        const sx = stripX * scaleX
        const sw = currentStripWidth * scaleX
        const sh = img.naturalHeight

        ctx.drawImage(img, sx, 0, sw, sh, stripX, 0, currentStripWidth, height)
      }
    }
  }

  const blob = await canvasToBlob(canvas, type, quality)
  return new File([blob], fileName, { type })
}

async function sourceToImage(source: LenticularImageSource): Promise<HTMLImageElement> {
  return typeof source === 'string' ? loadImage(source) : waitImageLoaded(source)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      image.crossOrigin = 'anonymous'
    }

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`图像加载失败: ${src}`))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('无法生成图片文件'))
      },
      type,
      quality,
    )
  })
}

function waitImageLoaded(image: HTMLImageElement): Promise<HTMLImageElement> {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve(image)
  }

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图像加载失败'))
  })
}
