import { blobToFile } from '@/utils/convert'
import { compressPhoto } from '@/utils/file/compressImage'
import { v1 } from 'uuid'

/**
 * 获取用户图片
 * @param option 压缩选项
 * @returns 返回一个 Promise，该 Promise 在用户选择图片后解析为 File 对象
 */
export function getUserImage(option?: Compressor.Options) {
  return new Promise<File>((resolve, reject) => {
    const input = document.createElement('input')
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
      if (!file) return
      if (file) {
        compressPhoto(file, option)
          .then((f) => {
            resolve(blobToFile(f, `${v1()}.jpg`))
          })
          .catch((err) => {
            reject(err)
          })
          .finally(() => {
            document.body.removeChild(input)
          })
      } else {
        document.body.removeChild(input)
        reject(new Error('No file selected'))
      }
    }
    input.click()
  })
}

export function getUserVideo() {
  return new Promise<File>((resolve, reject) => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.type = 'file'
    input.accept = 'video/*'
    input.multiple = false

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file) {
        resolve(file)
      } else {
        reject(new Error('No file selected'))
      }
      document.body.removeChild(input)
    }
    input.click()
  })
}

export function getUserFile(accept = '*') {
  return new Promise<File>((resolve, reject) => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.type = 'file'
    input.accept = accept
    input.multiple = false

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file) {
        resolve(file)
      } else {
        reject(new Error('No file selected'))
      }
      document.body.removeChild(input)
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
