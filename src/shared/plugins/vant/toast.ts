import type { ToastOptions } from 'vant'
import { showLoadingToast as loadingToast, setToastDefaultOptions, showToast as toast } from 'vant'
import 'vant/es/toast/style'
import fail from './icon/op_close.svg'
import success from './icon/op_success.svg'
import info from './icon/promot_info.svg'

setToastDefaultOptions({
  forbidClick: true,
  overlay: true,
  duration: 1200,
  overlayClass: 'center_toast_overlay',
  transition: 'center-toast',
  position: 'middle',
  className: 'center_toast',
  teleport: '#app',
  closeOnClickOverlay: true,
})
setToastDefaultOptions('loading', { duration: 0, loadingType: 'spinner' })

const statusMap = { success, info, fail }

export function showToast(option: (ToastOptions & { status?: 'success' | 'info' | 'fail' }) | string) {
  if (typeof option === 'string') return toast(option)

  const _message = option?.status
    ? `<img style="height: 26px;margin-right:6px;" src="${statusMap[option.status]}" /><p>${option?.message || ''}</p>`
    : option?.message || ''

  return toast({ ...option, message: _message, type: 'html' })
}

export function showSuccessToast(option: string | ToastOptions) {
  return showToast(
    typeof option === 'string' ? { message: option, status: 'success' } : { ...option, status: 'success' },
  )
}

export function showInfoToast(option: string | ToastOptions) {
  return showToast(typeof option === 'string' ? { message: option, status: 'info' } : { ...option, status: 'info' })
}

export function showFailToast(option: string | ToastOptions) {
  return showToast(typeof option === 'string' ? { message: option, status: 'fail' } : { ...option, status: 'fail' })
}

export const showLoadingToast = loadingToast
