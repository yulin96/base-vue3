import { loadQRCodeLib } from '@/utils/qrcode'

let qrCodeTaskId = 0
let cachedCode: { url: string; image: Promise<string> } | undefined

const removeCurrentQRCode = () => {
  const currentNode = document.querySelector('.code-tips.pc')
  if (currentNode && currentNode.parentNode) {
    currentNode.parentNode.removeChild(currentNode)
  }
}

export async function createQRCode(app: HTMLDivElement) {
  const taskId = ++qrCodeTaskId
  removeCurrentQRCode()

  const clearedUrl = location.href.split('#')[0] || location.href

  try {
    if (cachedCode?.url !== clearedUrl) {
      const image = loadQRCodeLib().then((lib) =>
        lib.toDataURL(clearedUrl, { margin: 2, errorCorrectionLevel: 'H', width: 900 }),
      )
      cachedCode = { url: clearedUrl, image }
      void image.catch(() => {
        if (cachedCode?.image === image) cachedCode = undefined
      })
    }
    const res = await cachedCode.image
    if (taskId !== qrCodeTaskId) return

    const div = document.createElement('div')
    const left = Math.round(app.getBoundingClientRect().right + innerWidth / 100)
    div.style.left = `${left}px`
    div.classList.add('code-tips')
    div.classList.add('pc')

    const image = document.createElement('img')
    image.src = res
    div.appendChild(image)
    image.onclick = () => {
      const a = document.createElement('a')
      a.href = res
      a.download = `【二维码】${document.title}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }

    const p = document.createElement('p')
    p.innerHTML = '手机扫码查看'
    div.appendChild(p)

    document.body.appendChild(div)

    const divRight = div.getBoundingClientRect().right
    if (divRight > innerWidth) {
      div.remove()
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

export function removeQRCode() {
  qrCodeTaskId++
  removeCurrentQRCode()
}
