const focusMap = new Map<string, gsap.core.Timeline>()

export function focusElement(name: string) {
  const dom = document.querySelector(`[${name}]`)

  if (dom) {
    dom.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const oldTimeline = focusMap.get(name)
    if (oldTimeline) oldTimeline.kill()

    const timeline = gsap
      .timeline({
        onComplete: () => {
          timeline.kill()
          focusMap.delete(name)
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
      .to(dom, { duration: 0.5, color: '#000', borderColor: '#e8e8e8' }, '>1')

    focusMap.set(name, timeline)
  }
}
