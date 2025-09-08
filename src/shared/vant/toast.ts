import { useLoading } from '@/hooks/useLoading'
import type { ToastOptions } from 'vant'
import { setToastDefaultOptions, showToast as toast } from 'vant'
import 'vant/es/toast/style'
import fail from './icon/fail.svg'
import info from './icon/info.svg'
import success from './icon/success.svg'

setToastDefaultOptions({
  forbidClick: true,
  overlay: true,
  duration: 1200,
  overlayClass: 'center_toast_overlay',
  transition: 'center_fromTop_toast',
  position: 'middle',
  className: 'center_toast',
  teleport: '#app',
  closeOnClickOverlay: true,
})
setToastDefaultOptions('loading', { duration: 0, loadingType: 'spinner' })

const { start } = useLoading([success, info, fail])
start()

const statusMap = { success, info, fail }

export function showMyToast(option: (ToastOptions & { status?: 'success' | 'info' | 'fail' }) | string) {
  if (typeof option === 'string') return toast(option)

  const _message = option?.status
    ? `<img style="height: 20px;margin-right:6px;" src="${statusMap[option.status]}" /><p>${option?.message || ''}</p>`
    : option?.message || ''

  return toast({ ...option, message: _message, type: 'html' })
}
