import { blobToFile } from '@/utils/convert/file'
import { compressPhoto } from '@/utils/file/compressImage'
import { v4 } from 'uuid'
import { toast } from 'vue-sonner'

/**
 * 获取用户图片
 * @param option 压缩选项
 * @returns 返回一个 Promise，该 Promise 在用户选择图片后解析为 File 对象
 */
export async function getUserImage(option?: Compressor.Options) {
  const file = await selectUserFile('image/*')
  if (!file) return
  try {
    const compressedFile = await compressPhoto(file, option)
    const sourceExtension = file.name.match(/\.([^.]+)$/)?.[1]
    const mimeExtension = compressedFile.type.match(/^image\/([^;+]+)/)?.[1]
    const extension =
      compressedFile.type === file.type ? sourceExtension || mimeExtension : mimeExtension || sourceExtension
    return blobToFile(compressedFile, `${v4()}${extension ? `.${extension}` : ''}`)
  } catch {
    toast.warning('请上传有效的图片文件')
  }
}

export function getUserVideo() {
  return selectUserFile('video/*')
}

export function getUserFile(accept = '*') {
  return selectUserFile(accept)
}

function selectUserFile(accept: string) {
  return new Promise<File | void>((resolve) => {
    const input = document.createElement('input')
    let settled = false
    let focusTimer: number | undefined

    const finish = (file?: File) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(file)
    }

    const cleanup = () => {
      if (focusTimer !== undefined) clearTimeout(focusTimer)
      window.removeEventListener('focus', handleWindowFocus)
      input.onchange = null
      input.oncancel = null
      input.remove()
    }

    const handleWindowFocus = () => {
      focusTimer = window.setTimeout(() => finish(input.files?.[0]), 300)
    }

    input.type = 'file'
    input.accept = accept
    input.multiple = false
    input.style.display = 'none'
    document.body.appendChild(input)

    input.onchange = () => finish(input.files?.[0])
    input.oncancel = () => finish()
    window.addEventListener('focus', handleWindowFocus)

    try {
      input.click()
    } catch (error) {
      settled = true
      cleanup()
      throw error
    }
  })
}

export function getPosition() {
  return new Promise<GeolocationCoordinates>((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position.coords)
        },
        (error) => reject(error),
      )
    } else {
      reject(new Error('你的浏览器不支持当前地理位置信息获取'))
    }
  })
}
