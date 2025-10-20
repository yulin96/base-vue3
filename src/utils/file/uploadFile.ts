import { sleep } from '@/shared/common'
import { failToast, loadingToast, successToast } from '@/shared/plugins/vant/toast'
import axios, { toFormData } from 'axios'
import COS from 'cos-js-sdk-v5'
import { v4 } from 'uuid'
import { closeToast } from 'vant/lib/toast'

type IUploadOption = {
  id: string
  file: File
  type?: string
  start?: string
  showLoading?: boolean
  test?: boolean
}

export async function uploadFile(option: IUploadOption): Promise<[null, string] | [unknown, null]> {
  return new Promise<[null, string] | [unknown, null]>(async (resolve) => {
    const { id, file, type = 'jpg', start = 'zh', showLoading = false, test = true } = option

    showLoading && loadingToast('上传中...')

    try {
      const {
        data: { data },
      } = await axios.post('https://rally.event1.cn/bn9z/sts', toFormData({ puid: id, type: 'sts' }))

      const { startTime, expiredTime, bucket, region, dir } = data
      const { sessionToken, tmpSecretId, tmpSecretKey } = data.credentials

      const cos = new COS({
        getAuthorization: function (_, callback) {
          callback({
            TmpSecretId: tmpSecretId,
            TmpSecretKey: tmpSecretKey,
            SecurityToken: sessionToken,
            StartTime: startTime,
            ExpiredTime: expiredTime,
          })
        },
      })

      const Key = `${dir}/${start}-${v4()}.${type}`

      cos.uploadFile(
        {
          Bucket: bucket,
          Region: region,
          Key,
          Body: file,
          SliceSize: 1024 * 1024,
        },
        async (err, data) => {
          if (err) return (showError('上传失败'), resolve([err, null]))

          await sleep(3000)
          const url = `https://oss.1ycloud.com/${Key}`
          if (test) {
            const available = await isResourceAvailable(url)
            if (!available) {
              return (showError('上传文件不符合规范，请更换文件重试'), resolve([err, null]))
            }
          }

          resolve([null, url])
          closeToast()
          successToast('上传成功')
        },
      )
    } catch (error) {
      ;(showError('上传失败'), resolve([error, null]))
    }

    function showError(message: string) {
      closeToast()
      failToast(message)
    }
  })
}

export async function isResourceAvailable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.status >= 200 && res.status < 300
  } catch {
    return false
  }
}
