document.addEventListener('click', (e) => {
  const ele = (e.target as HTMLElement)?.closest('[btn]')

  if (ele) {
    // createClickEffect(e.pageX, e.pageY)
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
