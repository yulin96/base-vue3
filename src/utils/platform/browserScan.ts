import './browserScan.css'

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const READER_ID = 'browser-scan-reader'
export const SCAN_CANCELLED = '取消扫码'

export async function browserScan(): Promise<string> {
  const root = document.createElement('div')
  root.className = 'browser-scan'

  const reader = document.createElement('div')
  reader.id = READER_ID
  reader.className = 'browser-scan__reader'

  const overlay = document.createElement('div')
  overlay.className = 'browser-scan__overlay'
  overlay.innerHTML = `
    <div class="browser-scan__status">将二维码放入框内</div>
    <div class="browser-scan__frame">
      <i class="browser-scan__corner browser-scan__corner--top-left"></i>
      <i class="browser-scan__corner browser-scan__corner--top-right"></i>
      <i class="browser-scan__corner browser-scan__corner--bottom-left"></i>
      <i class="browser-scan__corner browser-scan__corner--bottom-right"></i>
      <i class="browser-scan__line"></i>
    </div>
  `

  const loading = document.createElement('div')
  loading.className = 'browser-scan__loading'
  loading.innerHTML = `
    <i class="browser-scan__spinner"></i>
    <span>正在打开相机</span>
  `

  const close = document.createElement('div')
  close.className = 'browser-scan__close'
  close.textContent = '×'

  root.append(reader, overlay, loading, close)
  document.body.appendChild(root)

  const originalOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  const scanner = new Html5Qrcode(READER_ID, {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    verbose: false,
  })

  return await new Promise<string>((resolve, reject) => {
    let finished = false

    async function finish(result = '', error?: unknown) {
      if (finished) return
      finished = true

      close.removeEventListener('click', closeScan)
      try {
        await startPromise.catch(() => null)
        if (scanner.isScanning) await scanner.stop()
      } finally {
        scanner.clear()
        root.remove()
        document.body.style.overflow = originalOverflow
      }

      if (error) reject(error)
      else resolve(result)
    }

    function closeScan() {
      void finish('', SCAN_CANCELLED)
    }

    close.addEventListener('click', closeScan)

    const startPromise = scanner.start(
      { facingMode: 'environment' },
      {
        fps: 15,
      },
      (decodedText) => void finish(decodedText),
      undefined,
    )
    startPromise.then(() => {
      const video = reader.querySelector('video')
      if (!video || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        loading.remove()
        return
      }

      video.addEventListener('playing', () => loading.remove(), { once: true })
    })
    startPromise.catch((error) => void finish('', error))
  })
}
