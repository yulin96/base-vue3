import { showInfoToast } from '@/shared/plugins/vant/toast'

export default class LineCanvas {
  private el: HTMLElement
  private lineWidth: number
  private color: string
  private background: string
  private canvas: HTMLCanvasElement
  private cxt!: CanvasRenderingContext2D
  private signing = false

  constructor(props: { el: HTMLElement; lineWidth?: number; color?: string; background?: string }) {
    const { el, lineWidth = 10, color = '#222', background = '#fff' } = props
    this.el = el
    this.lineWidth = lineWidth
    this.color = color
    this.background = background

    this.canvas = document.createElement('canvas') as HTMLCanvasElement
    this.canvas.width = this.el.clientWidth
    this.canvas.height = this.el.clientHeight
    this.el.prepend(this.canvas)

    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      alert('您的浏览器不支持canvas，请更换浏览器后重试！')
      return
    }
    this.cxt = ctx
    this.ctxInit()

    this.canvas.addEventListener('touchstart', (e) => this.touchstart(e), false)
    this.canvas.addEventListener('touchmove', (e) => this.touchmove(e), false)
    this.canvas.addEventListener('touchend', () => this.touchend(), false)
  }

  // 初始化绘画的线条
  private ctxInit = () => {
    this.cxt.fillStyle = this.background
    this.cxt.strokeStyle = this.color
    this.cxt.lineWidth = this.lineWidth
    this.cxt.lineCap = 'round'
    this.cxt.lineJoin = 'round'
    this.cxt.shadowColor = '#000'
    this.cxt.shadowBlur = 1
    this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 绘制开始
  private touchstart = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
    if (touch) {
      this.cxt.beginPath()
      this.cxt.moveTo(touch.pageX, touch.pageY)
    }
  }

  // 绘制中
  private touchmove = (e: TouchEvent) => {
    const touch = e.changedTouches[0]
    if (touch) {
      this.signing = true
      this.cxt.lineTo(touch.pageX, touch.pageY)
      this.cxt.stroke()
    }
  }

  // 绘制结束
  private touchend = () => {
    this.cxt.closePath()
  }

  // 清除
  public clear = () => {
    this.signing = false
    this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 销毁
  public destroy = () => {
    this.canvas.removeEventListener('touchstart', this.touchstart, false)
    this.canvas.removeEventListener('touchmove', this.touchmove, false)
    this.canvas.removeEventListener('touchend', this.touchend, false)
    this.el.removeChild(this.canvas)
  }

  // 保存为图片
  public save = () => {
    if (!this.signing) {
      showInfoToast('请先签名')
      return ''
    } else {
      return this.canvas.toDataURL('image/png', 0.8)
    }
  }

  public getColor = () => this.color
  public setColor = (color: string) => (this.color = color)
}
