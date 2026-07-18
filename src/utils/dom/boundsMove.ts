export function boundsMove(element: HTMLDivElement, to: DOMRect, from?: DOMRect) {
  return new Promise<HTMLDivElement>((resolve, reject) => {
    const fromElement = element.cloneNode(true) as HTMLDivElement

    const {
      left: fromLeft,
      top: fromTop,
      width: fromWidth,
      height: fromHeight,
    } = from || element.getBoundingClientRect()
    const { left: toLeft, top: toTop, width: toWidth, height: toHeight } = to

    if (fromWidth <= 0 || fromHeight <= 0 || toWidth < 0 || toHeight < 0) {
      reject(new RangeError('动画元素尺寸无效'))
      return
    }

    fromElement.style.position = 'fixed'
    fromElement.style.left = fromLeft + 'px'
    fromElement.style.top = fromTop + 'px'
    fromElement.style.width = fromWidth + 'px'
    fromElement.style.height = fromHeight + 'px'
    fromElement.style.zIndex = '900001'
    fromElement.style.pointerEvents = 'none'
    document.body.appendChild(fromElement)

    const x = -(fromLeft - toLeft + (fromWidth - toWidth) / 2)
    const y = -(fromTop - toTop + (fromHeight - toHeight) / 2)
    const scale = toWidth / fromWidth

    const finish = () => {
      fromElement.remove()
      resolve(element)
    }

    gsap.to(fromElement, {
      scale,
      x,
      y,
      duration: 1.2,
      ease: 'back.in',
      onComplete: finish,
      onInterrupt: finish,
    })
  })
}
