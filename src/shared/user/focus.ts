export function focus(name: string) {
  const dom = document.querySelector(`[${name}]`)

  // dom.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })

  gsap.timeline().to(dom, { duration: 0.15, scale: 1.1 }).to(dom, { duration: 0.15, scale: 1 })

  gsap.to(dom, { duration: 0.3, border: '2px dashed #424242' }).then(() => {
    setTimeout(() => {
      gsap.to(dom, { duration: 0.3, border: '2px dashed #42424200', delay: 0.3 })
    }, 600)
  })
}
