import confetti from 'canvas-confetti'

export function showConfetti(options?: confetti.Options) {
  confetti({
    particleCount: 120,
    spread: 70,
    angle: -90,
    origin: { y: -0.6 },
    ...options,
  })
}

export function showSideConfetti(options?: confetti.Options) {
  confetti({
    particleCount: 90,
    spread: 50,
    angle: 50,
    origin: { y: 0.3, x: -0.5 },
    ...options,
  })
  confetti({
    particleCount: 90,
    spread: 50,
    angle: 130,
    origin: { y: 0.3, x: 1.5 },
    ...options,
  })
}
