import type QRCode from 'qrcode'
import { shallowRef, toRef, watch, type MaybeRefOrGetter } from 'vue'

type QRCodeLib = typeof import('qrcode')

let qrCodeLibPromise: Promise<QRCodeLib> | null = null
const loadQRCodeLib = async () => {
  if (!qrCodeLibPromise) {
    qrCodeLibPromise = import('qrcode')
      .then((mod) => ('default' in mod ? (mod.default as unknown as QRCodeLib) : mod))
      .catch((error) => {
        qrCodeLibPromise = null
        throw error
      })
  }
  return qrCodeLibPromise
}

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
        const QRCode = await loadQRCodeLib()
        if (currentRequestId !== requestId) return

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
