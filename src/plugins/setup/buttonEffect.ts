type InlineStyleValue = {
  value: string
  priority: string
}

type Button3dState = {
  animation: Animation
  cleanupListeners: () => void
  originalStyles: Map<string, InlineStyleValue>
}

const buttonAnimations = new WeakMap<HTMLElement, Animation>()
const button3dStates = new WeakMap<HTMLElement, Button3dState>()
const BUTTON_3D_STYLE_PROPERTIES = ['transform-origin', 'transform-style', 'will-change'] as const

function trackButtonAnimation(element: HTMLElement, animation: Animation) {
  buttonAnimations.get(element)?.cancel()
  buttonAnimations.set(element, animation)

  const clear = () => {
    if (buttonAnimations.get(element) === animation) buttonAnimations.delete(element)
  }

  animation.addEventListener('finish', clear, { once: true })
  animation.addEventListener('cancel', clear, { once: true })
}

function captureButton3dStyles(element: HTMLElement) {
  return new Map<string, InlineStyleValue>(
    BUTTON_3D_STYLE_PROPERTIES.map((property) => [
      property,
      {
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      },
    ]),
  )
}

function restoreButton3dStyles(element: HTMLElement, styles: Map<string, InlineStyleValue>) {
  styles.forEach(({ value, priority }, property) => {
    if (value) element.style.setProperty(property, value, priority)
    else element.style.removeProperty(property)
  })
}

function disposeButton3dState(element: HTMLElement) {
  const state = button3dStates.get(element)
  if (!state) return

  state.cleanupListeners()
  state.animation.cancel()
  restoreButton3dStyles(element, state.originalStyles)
  button3dStates.delete(element)
}

document.addEventListener('pointerdown', (e) => {
  const ele = (e.target as HTMLElement)?.closest('[btn]') as HTMLElement | null

  if (!ele || ele.dataset.disabled === 'true' || ele.hasAttribute('btn3d')) return

  const animation = ele.animate([{ scale: 1 }, { scale: 0.96 }, { scale: 1 }], {
    duration: 300,
    easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
  })
  trackButtonAnimation(ele, animation)
})

document.addEventListener('pointerdown', (e) => {
  const ele = (e.target as HTMLElement)?.closest('[btn3d]') as HTMLElement | null

  if (!ele || ele.dataset.disabled === 'true') return

  const rect = ele.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height

  const offsetX = x - 0.5
  const offsetY = y - 0.5

  const rotateX = offsetY * -16
  const rotateY = offsetX * 16
  const pressedTransform = `perspective(520px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(0.97)`

  disposeButton3dState(ele)
  const originalStyles = captureButton3dStyles(ele)

  ele.style.transformOrigin = 'center'
  ele.style.transformStyle = 'preserve-3d'
  ele.style.willChange = 'transform'

  const pressAnimation = ele.animate(
    [{ transform: 'perspective(520px) rotateX(0deg) rotateY(0deg) scale(1)' }, { transform: pressedTransform }],
    {
      duration: 160,
      easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
      fill: 'forwards',
    },
  )

  const reset = () => {
    const state = button3dStates.get(ele)
    if (!state || state.animation !== pressAnimation) return

    state.cleanupListeners()
    pressAnimation.cancel()

    const resetAnimation = ele.animate(
      [{ transform: pressedTransform }, { transform: 'perspective(520px) rotateX(0deg) rotateY(0deg) scale(1)' }],
      {
        duration: 320,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      },
    )
    state.animation = resetAnimation

    resetAnimation.addEventListener(
      'finish',
      () => {
        if (button3dStates.get(ele) !== state) return

        resetAnimation.cancel()
        restoreButton3dStyles(ele, originalStyles)
        button3dStates.delete(ele)
      },
      { once: true },
    )
  }

  const cleanupListeners = () => {
    window.removeEventListener('pointerup', reset)
    window.removeEventListener('pointercancel', reset)
  }

  button3dStates.set(ele, { animation: pressAnimation, cleanupListeners, originalStyles })
  window.addEventListener('pointerup', reset)
  window.addEventListener('pointercancel', reset)
})
