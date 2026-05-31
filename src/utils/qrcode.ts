type QRCodeLib = typeof import('qrcode')

let qrCodeLibPromise: Promise<QRCodeLib> | null = null

export const loadQRCodeLib = async () => {
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
