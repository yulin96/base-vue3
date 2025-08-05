import { useDocumentVisibility } from '@vueuse/core'
import { random, randomInt, sample } from 'es-toolkit'
import { v4 } from 'uuid'
import { onActivated, onDeactivated, onMounted, onUnmounted, useTemplateRef } from 'vue'

interface StarsController {
  key: string
  start: () => void
  stop: () => void
  destroy: () => void
}

export function createStars(initialKey: string): StarsController {
  const key = initialKey || v4()
  const starsBoxRef = useTemplateRef<HTMLDivElement>(key)

  onMounted(() => {
    if (starsBoxRef.value) {
      const style = window.getComputedStyle(starsBoxRef.value)
      const position = style.position
      if (!position) {
        starsBoxRef.value.style.position = 'relative'
      }
    }
  })

  const visibility = useDocumentVisibility()
  let timeoutId: number | null = null
  let isRunning = false

  const loopCreate = () => {
    if (!isRunning) return
    if (!starsBoxRef.value) return
    timeoutId = window.setTimeout(
      () => {
        loopCreate()
        if (visibility.value === 'visible' && isRunning) {
          starsBoxRef.value && createStar(starsBoxRef.value)
        }
      },
      starsBoxRef.value.children.length > 20 ? randomInt(600, 1000) : randomInt(50, 100),
    )
  }

  const start = () => {
    if (isRunning) return
    isRunning = true
    loopCreate()
  }

  const stop = () => {
    isRunning = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const destroy = () => {
    stop()
    while (starsBoxRef.value && starsBoxRef.value.firstChild) {
      starsBoxRef.value.removeChild(starsBoxRef.value.firstChild)
    }
  }

  onMounted(() => {
    start()
  })

  onActivated(() => {
    start()
  })

  onDeactivated(() => {
    stop()
  })

  onUnmounted(() => {
    stop()
  })

  return {
    key,
    start,
    stop,
    destroy,
  }
}

async function createStar(starsBox: HTMLDivElement) {
  const star = document.createElement('div')

  const size = Math.floor(randomInt(2, 6))
  star.style.width = `${size}px`
  star.style.height = `${size}px`
  star.style.backgroundColor = '#fff'
  star.style.borderRadius = '50%'
  star.style.boxShadow = `0 0 ${size}px 1px #fff9`
  star.style.opacity = '0'
  star.style.position = 'absolute'
  star.style.transform = `rotate(${randomInt(0, 360)}deg) scale(0)`
  star.style.left = `${Math.floor(randomInt(0, starsBox.clientWidth - 0))}px`
  star.style.top = `${Math.floor(randomInt(0, starsBox.clientHeight - 0))}px`

  starsBox.appendChild(star)

  await gsap.to(star, {
    opacity: 1,
    scale: randomTwoFloat(0.9, 1),
    duration: randomTwoFloat(2, 4),
    repeat: 1,
    yoyo: true,
    ease: randomCubicBezier(),
    repeatDelay: randomTwoFloat(0.6, 1),
    onComplete: () => {
      if (starsBox && star.parentNode === starsBox) {
        starsBox.removeChild(star)
      }
    },
  })

  function randomCubicBezier() {
    return sample([
      'cubic-bezier(0.33, 0.75, 0.19, 1)',
      'cubic-bezier(0.62, 0.68, 0.67, 0.99)',
      'cubic-bezier(0.09, 0.67, 0.06, 0.98)',
      'cubic-bezier(0.42, 0.81, 0.72, 1.13)',
      'cubic-bezier(0.71, 0.47, 0.45, 0.98)',
    ])
  }

  function randomTwoFloat(min: number, max: number) {
    return +random(min, max).toFixed(2)
  }
}
