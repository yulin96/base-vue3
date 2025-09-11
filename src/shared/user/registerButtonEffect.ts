function getClickableButton(e: TouchEvent | PointerEvent) {
  const target = e.target as HTMLDivElement
  const parent = target.parentElement as HTMLDivElement | null

  let ele = target?.hasAttribute('btn') ? target : parent?.hasAttribute('btn') ? parent : null
  if (!ele) ele = target?.getAttribute('type') === 'button' ? target : null
  return ele
}

export function registerButtonEffect() {
  document.addEventListener('touchstart', (e) => {
    const ele = getClickableButton(e)

    if (ele) {
      ele.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.96)', opacity: 0.9 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        {
          duration: 360,
          easing: 'cubic-bezier(0.4,0,0.2,1)',
        },
      )
    }
  })

  // document.addEventListener('click', (e) => {
  //   const ele = getClickableButton(e)

  //   if (ele) {
  //     createClickEffect(e.pageX, e.pageY)
  //   }
  // })
}
