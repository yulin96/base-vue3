import Lottie from 'lottie-web'
import bubble from './effect1.json'

export const createClickEffect = (x: number, y: number) => {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  const size = Math.floor(innerWidth / 2)
  div.style.left = `${x - size / 2}px`
  div.style.top = `${y - size / 2}px`
  div.style.width = `${size}px`
  div.style.height = `${size}px`
  div.style.opacity = '0.9'
  div.style.pointerEvents = 'none'

  document.body.appendChild(div)
  const animation = Lottie.loadAnimation({
    animationData: bubble,
    container: div,
    renderer: 'svg',
    loop: false,
    autoplay: false,
  })

  animation.addEventListener('DOMLoaded', () => {
    animation.goToAndPlay(12, true)
  })
  const cleanup = () => {
    animation.destroy()
    div.remove()
  }
  animation.addEventListener('complete', cleanup)
  animation.addEventListener('data_failed', cleanup)
  animation.addEventListener('error', cleanup)
}
