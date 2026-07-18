const focusMap = new WeakMap<Element, gsap.core.Timeline>()

export function focusDom(name: string) {
  const dom = document.querySelector(`[${name}]`)

  if (dom) {
    const rect = dom.getBoundingClientRect()
    const scrollBox = dom.closest('.scroll-box')
    const visibleRect = scrollBox?.getBoundingClientRect()
    const top = visibleRect?.top ?? 0
    const bottom = visibleRect?.bottom ?? (window.innerHeight || document.documentElement.clientHeight)

    if (rect.top < top || rect.bottom > bottom) {
      dom.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    const oldTimeline = focusMap.get(dom)
    if (oldTimeline) {
      oldTimeline.revert()
      focusMap.delete(dom)
    }

    const computedStyle = getComputedStyle(dom)
    const originalColor = computedStyle.color
    const originalBorderColor = computedStyle.borderColor

    const timeline = gsap
      .timeline({
        onComplete: () => {
          if (focusMap.get(dom) !== timeline) return

          focusMap.delete(dom)
          timeline.revert()
        },
      })
      .to(dom, {
        keyframes: [
          { duration: 0.1, x: -10 },
          { duration: 0.1, x: 10 },
          { duration: 0.1, x: -8 },
          { duration: 0.1, x: 8 },
          { duration: 0.1, x: -4 },
          { duration: 0.1, x: 4 },
          { duration: 0.1, x: 0 },
        ],
      })
      .to(dom, { duration: 0.5, color: '#e7000b', borderColor: '#e7000b' }, '<')
      .to(dom, { duration: 0.5, color: originalColor, borderColor: originalBorderColor }, '>1')

    focusMap.set(dom, timeline)
  }
}
