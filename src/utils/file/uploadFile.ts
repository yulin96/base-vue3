import { sleep } from '@/utils/common'
import axios, { toFormData } from 'axios'
import COS from 'cos-js-sdk-v5'
import { v4 } from 'uuid'
import { toast } from 'vue-sonner'

type IUploadOption = {
  id: string
  file: File
  type?: string
  start?: string
  loading?: boolean
  test?: boolean
}

export async function uploadFile(option: IUploadOption): Promise<[null, string] | [unknown, null]> {
  return new Promise<[null, string] | [unknown, null]>(async (resolve) => {
    const { id, file, type = 'jpg', start = 'zh', loading = false, test = true } = option

    let toastId: string | number | undefined = undefined
    let _updateTimer: number | undefined = undefined
    if (loading) {
      toastId = toast.loading('上传中...', {
        duration: Infinity,
        class: 'process-toast',
        style: {
          '--process-toast': '0%',
        },
      })
    }

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

      const Key = `${dir}/${start}-${v4()}.${type.toLowerCase()}`

      cos.uploadFile(
        {
          Bucket: bucket,
          Region: region,
          Key,
          Body: file,
          SliceSize: 1024 * 1024,
          onProgress: function (progressData) {
            const process = Math.floor(progressData.percent * 50)
            if (loading) updateLoadingToast(toastId, process)
          },
        },
        async (err, data) => {
          if (err) return (showError('上传失败'), resolve([err, null]))

          let process = 50
          _updateTimer = window.setInterval(() => {
            if (loading) updateLoadingToast(toastId, (process += 5))
          }, 500)
          await sleep(3000)
          const url = `https://oss.1ycloud.com/${Key}`
          if (test) {
            const available = await isResourceAvailable(url)
            if (!available) {
              return (showError('上传文件不符合规范，请更换文件重试'), resolve([err, null]))
            }
          }

          resolve([null, url])

          if (loading) {
            clearInterval(_updateTimer)
            updateLoadingToast(toastId, 100)
            toast.success('上传成功', { id: toastId })
            setTimeout(() => {
              toast.dismiss(toastId)
            }, 2000)
          }
        },
      )
    } catch (error) {
      ;(showError('上传失败'), resolve([error, null]))
    }

    function showError(message: string) {
      if (loading) {
        clearInterval(_updateTimer)
        updateLoadingToast(toastId, 100, true)
        toast.error(message, { id: toastId })
        setTimeout(() => {
          toast.dismiss(toastId)
        }, 2600)
      }
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

function updateLoadingToast(toastId: string | number | undefined, percent: number, isError = false) {
  toast.loading('上传中...', {
    id: toastId,
    style: {
      '--process-toast': `${Math.min(percent, 100)}%`,
      '--process-bg-process': isError ? 'var(--error-bg-process, #fff0f0ff)' : 'var(--process-bg-process, #ecfdf3ff)',
    },
  })
}
