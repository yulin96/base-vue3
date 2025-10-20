export interface FrameAnimationOption {
  el: string | HTMLCanvasElement // canvas元素id或者canvas元素
  urlPrefix: string // 图片路径前缀
  urlSuffix: string // 图片路径后缀
  maxLength: number // 图片最大序号
  fps?: number // 帧率

  autoPlay?: boolean // 是否自动播放
  poster?: string // 是否需要封面图片
  loop?: boolean // 是否循环播放
  loopNum?: number // 循环次数
  loopStartIndex?: number // 循环开始序号
  loopEndIndex?: number // 循环结束序号
}

/**
 * 帧动画
 * @example
 * new FrameAnimation({
 *   el: '#flower1',
 *   urlPrefix: 'https://oss.eventnet.cn/H5/zz/auto/fimfibde_20240229/imgs/',
 *   urlSuffix: '.png',
 *   maxLength: 35,
 *   fps: 30,
 * })
 */
export default class FrameAnimation {
  private option: FrameAnimationOption
  public canPlay = false
  public cycles = 0
  public playing = false
  private animationElement: HTMLCanvasElement
  private animationCtx: CanvasRenderingContext2D
  private width: number
  private height: number
  private posterImg!: HTMLImageElement
  private path!: [number, number, number, number]

  private imgList: HTMLImageElement[] = []
  private currentIndex = 1
  private fromTo: null | [number, number] = null

  constructor(option: FrameAnimationOption) {
    if (typeof option.el === 'string') {
      const el = document.querySelector(option.el)
      if (el instanceof HTMLCanvasElement) {
        this.animationElement = el
      } else {
        throw new Error('使用querySelector查询不到canvas元素')
      }
    } else {
      this.animationElement = option.el
    }

    this.option = option
    this.animationCtx = this.animationElement.getContext('2d')!
    this.width = this.animationElement.clientWidth * window.devicePixelRatio
    this.height = this.animationElement.clientHeight * window.devicePixelRatio
    this.animationElement.width = this.width
    this.animationElement.height = this.height
    this.path = [0, 0, this.width, this.height]

    this.init()
  }

  private async init() {
    const {
      maxLength,
      urlPrefix,
      urlSuffix,
      autoPlay = true,
      poster,
      loop = true,
      loopStartIndex = 0,
      loopEndIndex = maxLength,
    } = this.option

    if (poster) {
      try {
        const img = await loadImg(poster)
        this.posterImg = img
        this.animationCtx.drawImage(img, ...this.path)
      } catch (error) {
        console.error(`加载封面图片失败: ${poster}`, error)
      }
    }

    if (loop) this.fromTo = [loopStartIndex, loopEndIndex - 1]

    const imgList = Array.from({ length: maxLength }, (_, i) => loadImg(`${urlPrefix}${i + 1}${urlSuffix}`))
    let index = 0
    for await (const img of imgList) {
      this.imgList.push(img)
      index++
    }
    if (index !== maxLength) return console.error('图片加载失败')
    this.canPlay = true
    if (autoPlay) this.play()
  }

  public play() {
    if (this.playing) return console.error('已经在播放中')
    this.playing = true
    if (!this.fromTo) this.fromTo = [0, this.option.maxLength - 1]
    const [from, to] = this.fromTo
    this.currentIndex = this.currentIndex !== 0 ? this.currentIndex : this.cycles === 0 ? 0 : from

    const { fps = 60 } = this.option
    let lastTime = 0

    const _fps = Math.floor(1000 / fps)
    const frame = (time: number) => {
      if (!this.playing) return
      const interval =
        this.cycles === 0 ? _fps : (_fps / (this.fromTo![1] + 1 - this.fromTo![0])) * this.option.maxLength
      if (time - lastTime >= interval) {
        this.animationCtx.clearRect(...this.path)
        const currentImage = this.imgList[this.currentIndex]
        if (currentImage) {
          this.animationCtx.drawImage(currentImage, ...this.path)
        }
        if (this.currentIndex < to) {
          this.currentIndex++
        } else {
          this.currentIndex = from
          if (++this.cycles >= (this.option?.loopNum || Infinity)) return
        }

        lastTime = time
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  public pause() {
    this.playing = false
  }

  public stop() {
    this.animationCtx.clearRect(...this.path)
    this.animationCtx.drawImage(this.posterImg, ...this.path)
  }

  get isPlay() {
    return this.playing
  }
}

async function loadImg(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve(img)
    }
    img.onerror = () => reject(new Error(`加载图片失败: ${url}`))
    img.src = url
  })
}
