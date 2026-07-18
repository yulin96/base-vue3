import Lottie from 'lottie-web'

const LOTTIE_URL = 'https://oss.eventnet.cn/H5/zz/public/lotties/btn/btn3.json'
let bodyRegistered = false
let lottieData: unknown
let lottieLoadTask: Promise<void> | null = null

const preloadLottie = () => {
  if (lottieLoadTask) return lottieLoadTask

  lottieLoadTask = fetch(LOTTIE_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Lottie 加载失败: HTTP ${response.status}`)
      return response.json()
    })
    .then((data) => {
      lottieData = data
    })
    .catch((error) => {
      lottieLoadTask = null
      throw error
    })

  return lottieLoadTask
}

const handleBodyClick = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof HTMLElement) || !target.closest('[effect]')) return
  showLottie(event)
}

export const registerBodyLottie = () => {
  if (bodyRegistered) return unregisterBodyLottie
  bodyRegistered = true
  document.body.addEventListener('click', handleBodyClick)
  void preloadLottie().catch((error) => console.error('预加载 Lottie 动画失败:', error))
  return unregisterBodyLottie
}

export const unregisterBodyLottie = () => {
  if (!bodyRegistered) return
  bodyRegistered = false
  document.body.removeEventListener('click', handleBodyClick)
}

export function showLottie(e: MouseEvent) {
  const width = 200

  const { clientX, clientY } = e
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.width = `${width}px`
  div.style.height = `${width}px`
  div.style.top = `${clientY - width / 2}px`
  div.style.left = `${clientX - width / 2}px`
  div.style.pointerEvents = 'none'
  div.style.transform = `rotate(${Math.floor(Math.random() * 180)}deg)`
  document.body.appendChild(div)

  const animation = Lottie.loadAnimation({
    container: div,
    loop: false,
    autoplay: true,
    renderer: 'canvas',
    ...(lottieData ? { animationData: lottieData } : { path: LOTTIE_URL }),
  })
  animation.setSpeed(1.6)

  const cleanup = () => {
    window.clearTimeout(cleanupTimer)
    animation.destroy()
    div.remove()
  }
  const cleanupTimer = window.setTimeout(cleanup, 15000)

  animation.addEventListener('complete', cleanup)
  animation.addEventListener('data_failed', cleanup)
  animation.addEventListener('error', cleanup)
}
