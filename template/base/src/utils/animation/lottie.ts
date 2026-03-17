import Lottie from 'lottie-web'

fetch('https://oss.eventnet.cn/H5/zz/public/lotties/btn/btn3.json')
  .then((res) => res.json())
  .then((res) => {
    window['loadingLottieJson'] = res
  })

const registerBody = () => {
  document.body.addEventListener('click', (e) => {
    const target = e.target
    target instanceof HTMLElement &&
      (target.hasAttribute('effect') || target?.parentElement?.hasAttribute('effect')) &&
      showLottie(e)
  })
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
    ...(window['loadingLottieJson']
      ? { animationData: window['loadingLottieJson'] }
      : { path: 'https://oss.eventnet.cn/H5/zz/public/lotties/btn/btn3.json' }),
  })
  animation.setSpeed(1.6)

  animation.addEventListener('complete', () => {
    document.body.removeChild(div)
  })

  registerBody()
}
