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
  const { id, file, start = 'zh', loading = false, test = false } = option

  let toastId: string | number | undefined
  let updateTimer: number | undefined
  if (loading) {
    toastId = toast.loading('上传中...', {
      duration: Infinity,
      class: 'process-toast',
      style: {
        '--process-toast': '0%',
      },
    })
  }

  const showError = (message: string) => {
    if (!loading) return
    updateLoadingToast(toastId, 100, true)
    toast.error(message, { id: toastId })
    window.setTimeout(() => toast.dismiss(toastId), 2600)
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

    const key = `${uploadDir}${start}-${v4()}.${getExtension(file)}`

    await client.multipartUpload(key, file, {
      progress(progress) {
        if (loading) updateLoadingToast(toastId, Math.floor(progress * 50))
      },
    })

    if (loading) {
      let process = 50
      updateTimer = window.setInterval(() => {
        updateLoadingToast(toastId, (process += 5))
      }, 500)
    }

    await sleep(2000)
    const url = `https://up.eventnet.cn/${key}`

    if (test && !(await isResourceAvailable(url))) {
      showError('上传文件不符合规范，请更换文件重试')
      return [new Error('File upload verify failed'), null]
    }

    if (loading) {
      updateLoadingToast(toastId, 100)
      toast.success('上传成功', { id: toastId })
      window.setTimeout(() => toast.dismiss(toastId), 2000)
    }

    return [null, url]
  } catch (error) {
    showError('上传失败')
    return [error, null]
  } finally {
    if (updateTimer !== undefined) {
      clearInterval(updateTimer)
    }
  }
}

export function getExtension(file: File) {
  const nameParts = file.name.split('.')
  const fileNameExtension = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : undefined
  if (fileNameExtension) return fileNameExtension
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
