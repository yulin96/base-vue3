document.addEventListener('pointerdown', (e) => {
  const ele = (e.target as HTMLElement)?.closest('[btn]') as HTMLElement | null

  if (!ele || ele.dataset.disabled === 'true' || ele.hasAttribute('btn3d')) return

  ele.getAnimations().forEach((animation) => animation.cancel())

  ele.animate([{ scale: 1 }, { scale: 0.96 }, { scale: 1 }], {
    duration: 300,
    easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
  })
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

  ele.getAnimations().forEach((animation) => animation.cancel())

  ele.style.transformOrigin = 'center'
  ele.style.transformStyle = 'preserve-3d'
  ele.style.willChange = 'transform'

  ele.animate(
    [{ transform: 'perspective(520px) rotateX(0deg) rotateY(0deg) scale(1)' }, { transform: pressedTransform }],
    {
      duration: 160,
      easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
      fill: 'forwards',
    },
  )

  const reset = () => {
    window.removeEventListener('pointerup', reset)
    window.removeEventListener('pointercancel', reset)

    const resetAnimation = ele.animate(
      [{ transform: pressedTransform }, { transform: 'perspective(520px) rotateX(0deg) rotateY(0deg) scale(1)' }],
      {
        duration: 320,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      },
    )

    resetAnimation.addEventListener('finish', () => {
      ele.style.removeProperty('transform-origin')
      ele.style.removeProperty('transform-style')
      ele.style.removeProperty('will-change')
    })
  }

  window.addEventListener('pointerup', reset)
  window.addEventListener('pointercancel', reset)
})
