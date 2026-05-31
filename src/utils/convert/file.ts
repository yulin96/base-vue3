const blobToBase64Cache = new WeakMap<Blob, string>()

export async function urlToBlob(url: string): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('无法创建Canvas 2D上下文'))
        return
      }

      context.drawImage(image, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('无法生成Blob对象'))
      }, 'image/png')
    }

    image.onerror = () => reject(new Error(`图像加载失败: ${url}`))
    image.src = url
  })
}

export async function changeImageSize(originBlob: Blob, width = 600, height = 800): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('您的浏览器不支持Canvas API'))
      return
    }

    const img = new Image()
    const blobUrl = URL.createObjectURL(originBlob)

    img.onload = () => {
      try {
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('转换为Blob对象失败'))
              return
            }
            resolve(blob)
          },
          'image/jpeg',
          1,
        )
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('图像加载失败'))
    }

    img.src = blobUrl
  })
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const cached = blobToBase64Cache.get(blob)
  if (cached) return cached

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        blobToBase64Cache.set(blob, reader.result)
        resolve(reader.result)
      } else {
        reject(new Error('FileReader结果不是字符串'))
      }
    }

    reader.onerror = () => reject(new Error('读取Blob失败'))
    reader.readAsDataURL(blob)
  })
}

export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type })
}

export function base64ToBlob(urlData: string): Blob {
  if (!urlData.includes('base64')) {
    throw new Error('输入必须是有效的 base64 数据 URL')
  }

  const parts = urlData.split(';base64,')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('输入格式无效')
  }

  const mime = parts[0].split(':')[1] || 'application/octet-stream'
  const byteString = atob(parts[1])
  const buffer = new Uint8Array(byteString.length)

  for (let i = 0; i < byteString.length; i++) {
    buffer[i] = byteString.charCodeAt(i)
  }

  return new Blob([buffer], { type: mime })
}

export function base64ToFile(urlData: string, fileName: string): File {
  const blob = base64ToBlob(urlData)
  return new File([blob], fileName, { type: blob.type })
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer)
  const chunks: string[] = []
  const chunkSize = 8192

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize)
    chunks.push(String.fromCharCode.apply(null, chunk as unknown as number[]))
  }

  return btoa(chunks.join(''))
}

export function arrayBufferToBlob(buffer: ArrayBuffer, mimeType = 'application/octet-stream'): Blob {
  return new Blob([buffer], { type: mimeType })
}
