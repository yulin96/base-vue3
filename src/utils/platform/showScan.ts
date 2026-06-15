import { myDialog } from '@/plugins/vant/dialog'
import { isDingDing } from '@/utils/platform/dingtalk'
import { isWeChat } from '@/utils/platform/ua'
import { biz } from 'dingtalk-jsapi'

let isScanning = false
export function showScan() {
  return new Promise<string>(async (resolve, reject) => {
    if (isScanning) return reject('扫码功能正在运行中')
    isScanning = true

    if (isWeChat()) {
      try {
        const { wechatScan } = await import('@/utils/platform/wechat')
        resolve((await wechatScan()) || '')
      } catch {
        resolve('')
      } finally {
        isScanning = false
      }
      return
    } else if (isDingDing()) {
      biz.util
        .scan({ type: 'qrCode' })
        .then((res) => {
          resolve(res.text || '')
        })
        .catch(() => {
          resolve('')
        })
        .finally(() => {
          isScanning = false
        })
      return
    } else {
      injectStyles()
      const { container, readerId, cleanup } = createScanUI()

      import('html5-qrcode')
        .then(async ({ Html5Qrcode }) => {
          const html5Qrcode = new Html5Qrcode(readerId)
          let hasStopped = false

          const stopAndCleanup = async () => {
            if (hasStopped) return
            hasStopped = true
            try {
              if (html5Qrcode.isScanning) {
                await html5Qrcode.stop()
              }
            } catch (err) {
              console.error('Failed to stop html5Qrcode:', err)
            } finally {
              cleanup()
              isScanning = false
            }
          }

          const closeBtn = container.querySelector('#qr-scanner-close')
          if (closeBtn) {
            closeBtn.addEventListener('click', async () => {
              await stopAndCleanup()
              resolve('')
            })
          }

          try {
            await html5Qrcode.start(
              { facingMode: 'environment' },
              {
                disableFlip: false,
                fps: 10,
                qrbox: {
                  width: 250,
                  height: 250,
                },
              },
              async (decodedText) => {
                await stopAndCleanup()
                resolve(decodedText)
              },
              () => {
                // Ignore errors during scanning frame checks
              },
            )

            // 成功启动摄像头后，移除 loading 并激活扫描线
            const loadingEl = container.querySelector('#qr-scan-loading-el') as HTMLElement
            const lineEl = container.querySelector('.qr-scan-line') as HTMLElement
            if (loadingEl) {
              loadingEl.style.opacity = '0'
              setTimeout(() => {
                loadingEl.remove()
              }, 300)
            }
            if (lineEl) {
              lineEl.classList.add('active')
            }
          } catch (err: any) {
            console.error('Html5Qrcode start failed:', err)
            await stopAndCleanup()
            myDialog({ message: `启动扫码失败: ${err.message || err}` })
            resolve('')
          }
        })
        .catch((err) => {
          console.error('Failed to load html5-qrcode:', err)
          cleanup()
          isScanning = false
          myDialog({ message: '加载扫码组件失败' })
          resolve('')
        })
      return
    }
  })
}

function injectStyles() {
  const styleId = 'html5-qrcode-scanner-styles'
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.innerHTML = `
    @keyframes qr-scan-line-move {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
    @keyframes qr-spin {
      to { transform: rotate(360deg); }
    }
    .qr-scan-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      overflow: hidden;
      background-color: #0a0a0c;
    }
    #qr-scanner-reader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0a0a0c;
      z-index: 1;
    }
    #qr-scanner-reader video {
      width: 100% !important;
      height: 100% !important;
      // object-fit: cover !important;
    }
    .qr-scan-ui-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .qr-scan-box-wrapper {
      position: relative;
      width: 250px;
      height: 250px;
      z-index: 5;
    }
    .qr-scan-box {
      width: 100%;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
      overflow: hidden;
      position: relative;
    }
    .qr-scan-line {
      position: absolute;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(to right, transparent, rgba(16, 185, 129, 0.8), transparent);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
      animation: qr-scan-line-move 2.5s infinite linear;
      z-index: 6;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .qr-scan-line.active {
      opacity: 1;
    }
    .qr-scan-loading {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0a0a0c;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 8;
      gap: 16px;
      transition: opacity 0.4s ease;
    }
    .qr-scan-spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(255, 255, 255, 0.12);
      border-top-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
      animation: qr-spin 0.8s linear infinite;
    }
    .qr-scan-loading-text {
      color: #f3f4f6;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .qr-scan-corner {
      position: absolute;
      width: 26px;
      height: 26px;
      border: 4px solid #10b981;
      z-index: 7;
      pointer-events: none;
    }
    .qr-scan-corner-tl {
      top: -2px; left: -2px;
      border-right: none; border-bottom: none;
      border-top-left-radius: 16px;
    }
    .qr-scan-corner-tr {
      top: -2px; right: -2px;
      border-left: none; border-bottom: none;
      border-top-right-radius: 16px;
    }
    .qr-scan-corner-bl {
      bottom: -2px; left: -2px;
      border-right: none; border-top: none;
      border-bottom-left-radius: 16px;
    }
    .qr-scan-corner-br {
      bottom: -2px; right: -2px;
      border-left: none; border-top: none;
      border-bottom-right-radius: 16px;
    }
    .qr-scan-close-btn {
      position: absolute;
      top: 40px;
      right: 20px;
      width: 36px;
      height: 36px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      border: none;
      color: #fff;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
    }
    .qr-scan-info {
      position: absolute;
      margin-top: 300px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      text-align: center;
      padding: 0 16px;
      z-index: 10;
    }
  `
  document.head.appendChild(style)
}

function createScanUI() {
  const containerId = 'qr-scanner-overlay-container'
  const readerId = 'qr-scanner-reader'

  const oldContainer = document.getElementById(containerId)
  if (oldContainer) {
    oldContainer.remove()
  }

  const container = document.createElement('div')
  container.id = containerId
  container.className = 'qr-scan-overlay'

  container.innerHTML = `
    <div id="${readerId}"></div>
  `

  document.body.appendChild(container)

  const cleanup = () => {
    const el = document.getElementById(containerId)
    if (el) {
      el.remove()
    }
  }

  return { container, readerId, cleanup }
}
