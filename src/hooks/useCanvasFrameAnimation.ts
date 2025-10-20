import { v4 } from 'uuid'
import { nextTick, onMounted, onUnmounted, reactive, readonly, useTemplateRef } from 'vue'

export interface FrameAnimationOptions {
  /** 图片序列，可以是URL数组或图片对象数组 */
  frames: string[] | HTMLImageElement[]
  /** 帧率，默认30fps */
  fps?: number
  /** 是否自动播放，默认false */
  autoplay?: boolean
  /** 自动播放时从第几帧开始，默认0 */
  startFrame?: number
  /** 是否循环播放，默认false */
  loop?: boolean
  /** 循环播放的起始帧，默认0 */
  loopStart?: number
  /** 循环播放的结束帧，默认为总帧数-1 */
  loopEnd?: number
  /** 循环次数，-1为无限循环，默认-1 */
  loopCount?: number
  /** 封面帧索引，默认0 */
  coverFrame?: number
  /** 图片适配模式，默认'contain' */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none'
}

export interface FrameAnimationState {
  /** 当前帧索引 */
  currentFrame: number
  /** 是否正在播放 */
  isPlaying: boolean
  /** 是否已加载完成 */
  isLoaded: boolean
  /** 加载进度 0-1 */
  loadProgress: number
  /** 已完成的循环次数 */
  completedLoops: number
  /** 总帧数 */
  totalFrames: number
  /** 当前帧率 */
  currentFps: number
}

export function useCanvasFrameAnimation(options: FrameAnimationOptions) {
  const {
    frames,
    fps = 30,
    autoplay = false,
    startFrame = 0,
    loop = false,
    loopStart = 0,
    loopEnd = frames.length - 1,
    loopCount = -1,
    coverFrame = 0,
    objectFit = 'contain',
  } = options

  // 验证并修正循环参数
  const maxFrameIndex = frames.length - 1
  const validLoopStart = Math.max(0, Math.min(loopStart, maxFrameIndex))
  const validLoopEnd = Math.max(0, Math.min(loopEnd, maxFrameIndex))

  // 如果用户设置的循环范围超出了图片范围，给出警告
  if (loopStart > maxFrameIndex || loopEnd > maxFrameIndex) {
    console.warn(`循环范围超出图片数量范围。图片数量: ${frames.length}, 有效索引: 0-${maxFrameIndex}`)
    console.warn(`原始设置: loopStart=${loopStart}, loopEnd=${loopEnd}`)
    console.warn(`修正后: loopStart=${validLoopStart}, loopEnd=${validLoopEnd}`)
  }

  const key = v4()
  const canvas = useTemplateRef<HTMLCanvasElement>(key)

  // 状态管理
  const state = reactive<FrameAnimationState>({
    currentFrame: coverFrame,
    isPlaying: false,
    isLoaded: false,
    loadProgress: 0,
    completedLoops: 0,
    totalFrames: frames.length,
    currentFps: fps,
  })

  // 内部变量
  let ctx: CanvasRenderingContext2D | null = null
  let animationId: number | null = null
  let lastFrameTime = 0
  let images: HTMLImageElement[] = []
  let loadedCount = 0
  let targetFrame: number | null = null // 目标帧，用于播放到指定帧后停止
  let onCompleteCallback: (() => void) | null = null // 完成回调

  // 动态计算帧间隔时间（毫秒）
  const getFrameInterval = () => 1000 / state.currentFps

  // 预加载图片
  const preloadImages = async (): Promise<HTMLImageElement[]> => {
    // 优先加载封面帧
    const loadImage = (frame: string | HTMLImageElement, index: number): Promise<HTMLImageElement> => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        if (frame instanceof HTMLImageElement) {
          loadedCount++
          state.loadProgress = loadedCount / frames.length

          // 如果这是封面帧，立即存储并绘制
          if (index === coverFrame) {
            images[index] = frame
            nextTick(() => drawFrame(coverFrame))
          }

          resolve(frame)
          return
        }

        const img = new Image()
        img.onload = () => {
          loadedCount++
          state.loadProgress = loadedCount / frames.length

          // 如果这是封面帧，立即存储并绘制
          if (index === coverFrame) {
            images[index] = img
            nextTick(() => drawFrame(coverFrame))
          }

          resolve(img)
        }

        img.onerror = () => {
          console.error(`Failed to load frame ${index}: ${frame}`)
          reject(new Error(`Failed to load frame ${index}`))
        }

        img.src = frame as string
      })
    }

    try {
      // 创建所有加载任务
      const imagePromises = frames.map((frame, index) => loadImage(frame, index))

      // 如果封面帧不是第一个，先加载封面帧
      if (coverFrame !== 0 && coverFrame < frames.length) {
        try {
          // 优先等待封面帧加载完成
          await imagePromises[coverFrame]
        } catch (error) {
          console.warn(`Failed to prioritize cover frame ${coverFrame}:`, error)
        }
      }

      // 等待所有图片加载完成
      const loadedImages = await Promise.all(imagePromises)
      state.isLoaded = true

      // 确保所有图片都正确存储到images数组中
      images = loadedImages

      // 如果启用了自动播放且当前没在播放，开始播放
      if (autoplay && !state.isPlaying) {
        play(startFrame)
      }

      return loadedImages
    } catch (error) {
      console.error('Failed to preload all images:', error)
      throw error
    }
  }

  // 绘制当前帧
  const drawFrame = (frameIndex: number) => {
    if (!ctx || frameIndex < 0 || frameIndex >= frames.length) {
      return
    }

    // 检查图片是否已加载
    const img = images[frameIndex]
    if (!img || !canvas.value) {
      // 图片未加载时，可以选择显示加载状态或保持当前画面
      return
    }

    const canvasWidth = canvas.value.width
    const canvasHeight = canvas.value.height
    const imgWidth = img.naturalWidth || img.width
    const imgHeight = img.naturalHeight || img.height

    // 清除画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    let sourceX = 0
    let sourceY = 0
    let sourceWidth = imgWidth
    let sourceHeight = imgHeight
    let destX = 0
    let destY = 0
    let destWidth = canvasWidth
    let destHeight = canvasHeight

    // 根据不同的适配模式计算绘制参数
    switch (objectFit) {
      case 'contain': {
        // 保持宽高比，完整显示图片，可能有留白
        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
        destWidth = imgWidth * scale
        destHeight = imgHeight * scale
        destX = (canvasWidth - destWidth) / 2
        destY = (canvasHeight - destHeight) / 2
        break
      }

      case 'cover': {
        // 保持宽高比，填满Canvas，可能裁剪图片
        const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight)
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale

        if (scaledWidth > canvasWidth) {
          // 图片比Canvas宽，需要裁剪左右
          sourceWidth = canvasWidth / scale
          sourceX = (imgWidth - sourceWidth) / 2
        }

        if (scaledHeight > canvasHeight) {
          // 图片比Canvas高，需要裁剪上下
          sourceHeight = canvasHeight / scale
          sourceY = (imgHeight - sourceHeight) / 2
        }
        break
      }

      case 'fill': {
        // 拉伸填满，不保持宽高比
        // 使用默认值即可，destWidth和destHeight已经是canvas的尺寸
        break
      }

      case 'none': {
        // 原始尺寸，居中显示
        destWidth = imgWidth
        destHeight = imgHeight
        destX = (canvasWidth - destWidth) / 2
        destY = (canvasHeight - destHeight) / 2

        // 如果图片超出Canvas边界，进行裁剪
        if (destX < 0) {
          sourceX = -destX
          sourceWidth = Math.min(imgWidth, canvasWidth)
          destX = 0
          destWidth = sourceWidth
        }

        if (destY < 0) {
          sourceY = -destY
          sourceHeight = Math.min(imgHeight, canvasHeight)
          destY = 0
          destHeight = sourceHeight
        }

        if (destX + destWidth > canvasWidth) {
          destWidth = canvasWidth - destX
          sourceWidth = destWidth
        }

        if (destY + destHeight > canvasHeight) {
          destHeight = canvasHeight - destY
          sourceHeight = destHeight
        }
        break
      }
    }

    // 绘制图像
    try {
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight)
      state.currentFrame = frameIndex
    } catch (error) {
      console.error('Error drawing frame:', error, {
        frameIndex,
        imgWidth,
        imgHeight,
        canvasWidth,
        canvasHeight,
        objectFit,
      })
    }
  }

  // 动画循环
  const animate = (currentTime: number) => {
    if (!state.isPlaying) return
    if (currentTime - lastFrameTime >= getFrameInterval()) {
      let nextFrame = state.currentFrame + 1

      // 当有目标帧时，直接处理目标帧逻辑，不应用循环限制
      if (targetFrame !== null) {
        // 如果超出图片范围，停止播放
        if (nextFrame >= frames.length) {
          stop()
          const callback = onCompleteCallback
          targetFrame = null
          onCompleteCallback = null
          callback?.()
          return
        }
      } else {
        // 只有在没有目标帧时才应用循环限制
        if (nextFrame > validLoopEnd) {
          if (loop) {
            // 检查循环次数限制
            if (loopCount > 0 && state.completedLoops >= loopCount) {
              stop()
              // 执行完成回调（循环结束）
              const callback = onCompleteCallback
              onCompleteCallback = null
              callback?.()
              return
            }

            nextFrame = validLoopStart
            state.completedLoops++
          } else {
            // 不循环，停止播放（支持在非循环模式下使用loopEnd作为结束帧）
            stop()
            // 执行完成回调（播放结束）
            const callback = onCompleteCallback
            onCompleteCallback = null
            callback?.()
            return
          }
        }
      }

      // 绘制下一帧
      drawFrame(nextFrame)
      lastFrameTime = currentTime

      // 检查是否达到目标帧（在绘制后检查）
      if (targetFrame !== null && state.currentFrame >= targetFrame) {
        // 先保存回调函数，再停止动画
        const callback = onCompleteCallback
        targetFrame = null // 重置目标帧

        // 停止动画但保持当前帧位置（不重置到coverFrame）
        pause()
        onCompleteCallback = null // 重置回调

        if (callback) {
          try {
            callback() // 执行完成回调
          } catch (error) {
            console.error('回调函数执行出错:', error)
          }
        }
        return
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  // 播放控制方法
  const play = (fromFrame?: number, onComplete?: () => void) => {
    if (!state.isLoaded) {
      console.warn('Images not loaded yet')
      return
    }

    if (typeof fromFrame === 'number') {
      state.currentFrame = Math.max(0, Math.min(fromFrame, frames.length - 1))
      drawFrame(state.currentFrame)
    }

    // 如果有完成回调，设置为全局回调
    if (onComplete && targetFrame === null) {
      onCompleteCallback = onComplete
    }

    state.isPlaying = true
    lastFrameTime = performance.now()
    animationId = requestAnimationFrame(animate)
  }

  const pause = () => {
    state.isPlaying = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  const stop = () => {
    pause()
    state.currentFrame = coverFrame
    state.completedLoops = 0
    targetFrame = null // 重置目标帧
    onCompleteCallback = null // 重置回调
    drawFrame(state.currentFrame)
  }

  const goToFrame = (frameIndex: number) => {
    const targetFrameIndex = Math.max(0, Math.min(frameIndex, frames.length - 1))
    drawFrame(targetFrameIndex)
  }

  const goToAndPlay = (frameIndex: number, onComplete?: () => void) => {
    goToFrame(frameIndex)
    play(undefined, onComplete)
  }

  const goToAndStop = (frameIndex: number) => {
    stop()
    goToFrame(frameIndex)
  } // 播放到指定帧后停止
  const playToFrame = (endFrame: number, onComplete?: () => void) => {
    if (!state.isLoaded) {
      console.warn('Images not loaded yet')
      return
    }

    const validEndFrame = Math.max(0, Math.min(endFrame, frames.length - 1))

    // 如果目标帧就是当前帧，直接执行完成回调
    if (validEndFrame === state.currentFrame) {
      onComplete?.()
      return
    }

    // 如果目标帧在当前帧之前，直接跳转并执行回调
    if (validEndFrame < state.currentFrame) {
      goToFrame(validEndFrame)
      onComplete?.()
      return
    }

    // 重置之前的目标帧和回调
    if (targetFrame !== null) {
      targetFrame = null
      onCompleteCallback = null
    }

    // 设置目标帧和完成回调
    targetFrame = validEndFrame
    onCompleteCallback = onComplete || null

    state.isPlaying = true
    lastFrameTime = performance.now()
    animationId = requestAnimationFrame(animate)
  }

  // 从指定帧播放到指定帧后停止
  const playFromToFrame = (startFrame: number, endFrame: number, onComplete?: () => void) => {
    goToFrame(startFrame)
    playToFrame(endFrame, onComplete)
  }

  // 重置动画
  const reset = () => {
    stop()
    state.completedLoops = 0
    goToFrame(coverFrame)
  }

  // 动态调整帧率
  const setFps = (newFps: number) => {
    if (newFps <= 0) {
      console.warn('fps must be greater than 0')
      return
    }
    state.currentFps = newFps
  }

  // 初始化
  const init = async () => {
    try {
      // 获取Canvas元素
      if (!canvas.value) {
        throw new Error('Canvas element not found')
      }

      ctx = canvas.value.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get 2D context')
      }

      // 初始化图片数组，为封面帧预留位置
      images = new Array(frames.length)

      // 开始预加载图片（异步进行，封面帧会在加载完成后立即显示）
      preloadImages().catch(console.error)

      // 如果封面帧已经是HTMLImageElement，立即绘制
      if (frames[coverFrame] instanceof HTMLImageElement) {
        images[coverFrame] = frames[coverFrame] as HTMLImageElement
        await nextTick()
        drawFrame(coverFrame)
      }

      // 如果所有图片都已加载完成且启用了自动播放
      if (state.isLoaded && autoplay) {
        play(startFrame)
      }
    } catch (error) {
      console.error('Failed to initialize frame animation:', error)
      throw error
    }
  }

  // 销毁方法
  const destroy = () => {
    pause()
    images = []
    loadedCount = 0
    state.isLoaded = false
    state.loadProgress = 0
    state.completedLoops = 0
  }

  // 生命周期处理
  onMounted(() => {
    if (canvas.value) {
      const width = getComputedStyle(canvas.value).width
      const height = getComputedStyle(canvas.value).height
      canvas.value.width = parseFloat(width) * window.devicePixelRatio
      canvas.value.height = parseFloat(height) * window.devicePixelRatio
      init().catch(console.error)
    }
  })

  onUnmounted(() => {
    destroy()
  })

  return {
    key,

    // 状态
    state: readonly(state),

    // 控制方法
    init,
    play,
    pause,
    stop,
    reset,
    goToFrame,
    goToAndPlay,
    goToAndStop,
    playToFrame,
    playFromToFrame,
    destroy,
    setFps,

    // 工具方法
    preloadImages,
    drawFrame,
  }
}

export default useCanvasFrameAnimation
