import QRCode from 'qrcode'
import { shallowRef, toRef, watch, type MaybeRefOrGetter } from 'vue'

export function useQRCode(text: MaybeRefOrGetter<string>, options?: QRCode.QRCodeToDataURLOptions) {
  const renderOptions: QRCode.QRCodeToDataURLOptions = {
    width: 1200,
    margin: 1,
    errorCorrectionLevel: 'H',
    ...options,
  }

  const src = toRef(text)
  const result = shallowRef('')
  let requestId = 0

  watch(
    src,
    async (value) => {
      const currentRequestId = ++requestId

      if (!value) {
        result.value = ''
        return
      }

      try {
        const url = await QRCode.toDataURL(value, renderOptions)
        if (currentRequestId === requestId) result.value = url
      } catch {
        if (currentRequestId === requestId) result.value = ''
      }
    },
    { immediate: true },
  )

  return result
}
