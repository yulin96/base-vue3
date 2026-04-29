import { sleep } from '@/utils/common'
import OSS from 'ali-oss'
import axios, { toFormData } from 'axios'
import { v4 } from 'uuid'
import { toast } from 'vue-sonner'

type IUploadOption = {
  id: string
  file: File
  start?: string
  loading?: boolean
  test?: boolean
}

export async function uploadFile(option: IUploadOption): Promise<[null, string] | [unknown, null]> {
  return new Promise<[null, string] | [unknown, null]>(async (resolve) => {
    const { id, file, start = 'zh', loading = false, test = false } = option

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
      } = await axios.post('https://rally.event1.cn/bn9z/sts/oss', toFormData({ puid: id }))

      const { bucket, region, uploadDir, accessKeyId, accessKeySecret, stsToken } = data

      const client = new OSS({
        region: region.includes('oss-') ? region : `oss-${region}`,
        bucket,
        endpoint: 'https://up.eventnet.cn',
        cname: true,
        authorizationV4: true,
        accessKeyId,
        accessKeySecret,
        stsToken,
        refreshSTSToken: async () => {
          const {
            data: { data: refreshData },
          } = await axios.post('https://rally.event1.cn/bn9z/sts/oss', toFormData({ puid: id }))
          return {
            accessKeyId: refreshData.accessKeyId,
            accessKeySecret: refreshData.accessKeySecret,
            stsToken: refreshData.stsToken,
          }
        },
      })

      const Key = `${uploadDir}${start}-${v4()}.${getExtension(file)}`

      try {
        await client.multipartUpload(Key, file, {
          progress: async function (p) {
            const process = Math.floor(p * 50)
            if (loading) updateLoadingToast(toastId, process)
          },
        })
      } catch (err) {
        showError('上传失败')
        return resolve([err, null])
      }

      let process = 50
      _updateTimer = window.setInterval(() => {
        if (loading) updateLoadingToast(toastId, (process += 5))
      }, 500)

      await sleep(2000)
      const url = `https://up.eventnet.cn/${Key}`

      if (test) {
        const available = await isResourceAvailable(url)
        if (!available) {
          clearInterval(_updateTimer)
          showError('上传文件不符合规范，请更换文件重试')
          return resolve([new Error('File upload verify failed'), null])
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

export function getExtension(file: File) {
  const nameParts = file.name.split('.')
  if (nameParts.length > 1) return nameParts.pop()?.toLowerCase()
  return file.type.split('/')[1]?.split('+')[0] || 'png'
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
