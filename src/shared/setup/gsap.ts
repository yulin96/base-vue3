import { gsap } from 'gsap'

gsap.config({ force3D: true })
gsap.defaults({
  duration: 0.36,
  ease: 'power1.out',
  overwrite: 'auto',
})

// import { SplitText } from 'gsap/SplitText'
// gsap.registerPlugin(SplitText)

// import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
// gsap.registerPlugin(DrawSVGPlugin)

// import { MotionPathHelper } from 'gsap/MotionPathHelper'
// import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
// gsap.registerPlugin(MotionPathHelper)
// gsap.registerPlugin(MotionPathPlugin)

// import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
// gsap.registerPlugin(ScrambleTextPlugin)

// import { ScrollTrigger } from 'gsap/ScrollTrigger'
// import { ScrollSmoother } from 'gsap/ScrollSmoother'
// gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

window.gsap = gsap
