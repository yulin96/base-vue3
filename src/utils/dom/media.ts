import { infoToast } from '@/plugins/vant/toast'
import { blobToFile } from '@/utils/convert/file'
import { compressPhoto } from '@/utils/file/compressImage'
import { v4 } from 'uuid'

/**
 * 获取用户图片
 * @param option 压缩选项
 * @returns 返回一个 Promise，该 Promise 在用户选择图片后解析为 File 对象
 */
export function getUserImage(option?: Compressor.Options) {
  return new Promise<File | void>((resolve) => {
    const input = document.createElement('input')
    const cleanup = () => {
      input.onchange = null
      input.oncancel = null
      input.remove()
    }

    document.body.appendChild(input)
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false
    input.style.position = 'fixed'
    input.style.top = '0'
    input.style.left = '2000px'
    input.style.opacity = '0'

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        cleanup()
        resolve()
        return
      }

      compressPhoto(file, option)
        .then((f) => {
          resolve(blobToFile(f, `${v4()}.jpg`))
        })
        .catch(() => {
          infoToast('请上传有效的图片文件')
          resolve()
        })
        .finally(cleanup)
    }
    input.oncancel = () => {
      cleanup()
      resolve()
    }
    input.click()
  })
}

export function getUserVideo() {
  return new Promise<File | void>((resolve) => {
    const input = document.createElement('input')
    const cleanup = () => {
      input.onchange = null
      input.oncancel = null
      input.remove()
    }

    document.body.appendChild(input)
    input.type = 'file'
    input.accept = 'video/*'
    input.multiple = false

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      cleanup()
      if (!file) {
        resolve()
        return
      }
      resolve(file)
    }
    input.oncancel = () => {
      cleanup()
      resolve()
    }
    input.click()
  })
}

export function getUserFile(accept = '*') {
  return new Promise<File | void>((resolve) => {
    const input = document.createElement('input')
    const cleanup = () => {
      input.onchange = null
      input.oncancel = null
      input.remove()
    }

    document.body.appendChild(input)
    input.type = 'file'
    input.accept = accept
    input.multiple = false

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      cleanup()
      if (!file) {
        resolve()
        return
      }
      resolve(file)
    }
    input.oncancel = () => {
      cleanup()
      resolve()
    }
    input.click()
  })
}

export function getPosition() {
  return new Promise<GeolocationCoordinates>((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position.coords)
        },
        (...args) => {
          reject(args)
        },
      )
    } else {
      reject('你的浏览器不支持当前地理位置信息获取')
    }
  })
}
