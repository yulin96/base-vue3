import { nanoid } from 'nanoid'
import { onMounted, onUnmounted, reactive, readonly, useTemplateRef } from 'vue'

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

/** 缓存的帧布局参数 */
interface DrawParams {
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
  destX: number
  destY: number
  destWidth: number
  destHeight: number
}

export function useCanvasFrameAnimation(options: FrameAnimationOptions) {
  if (!options.frames?.length) {
    throw new Error('frames must contain at least one item')
  }

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

  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error('fps must be a finite number greater than 0')
  }

  const maxFrameIndex = frames.length - 1
  const clampFrame = (frame: number) => {
    if (!Number.isFinite(frame)) throw new RangeError('帧索引必须是有限数值')
    return Math.max(0, Math.min(Math.trunc(frame), maxFrameIndex))
  }
  const validCoverFrame = clampFrame(coverFrame)
  const validStartFrame = clampFrame(startFrame)
  const boundedLoopStart = clampFrame(loopStart)
  const boundedLoopEnd = clampFrame(loopEnd)
  const validLoopStart = Math.min(boundedLoopStart, boundedLoopEnd)
  const validLoopEnd = Math.max(boundedLoopStart, boundedLoopEnd)

  if (coverFrame !== validCoverFrame) {
    console.warn(`封面帧超出图片数量范围。图片数量: ${frames.length}, 已修正为: ${validCoverFrame}`)
  }

  if (startFrame !== validStartFrame) {
    console.warn(`起始帧超出图片数量范围。图片数量: ${frames.length}, 已修正为: ${validStartFrame}`)
  }

  if (loopStart !== validLoopStart || loopEnd !== validLoopEnd) {
    console.warn(`循环范围超出图片数量范围。图片数量: ${frames.length}, 有效索引: 0-${maxFrameIndex}`)
    console.warn(`原始设置: loopStart=${loopStart}, loopEnd=${loopEnd}`)
    console.warn(`修正后: loopStart=${validLoopStart}, loopEnd=${validLoopEnd}`)
  }

  const key = nanoid()
  const canvas = useTemplateRef<HTMLCanvasElement>(key)

  // 状态管理
  const state = reactive<FrameAnimationState>({
    currentFrame: validCoverFrame,
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
  let images: Array<HTMLImageElement | null> = []
  let loadedCount = 0
  let targetFrame: number | null = null
  let onCompleteCallback: (() => void) | null = null
  let resolveCompletion: (() => void) | null = null
  let loadingPromise: Promise<Array<HTMLImageElement | null>> | null = null
  let resizeObserver: ResizeObserver | null = null
  let playbackSessionId = 0
  let playbackRequestId = 0
  let loadingSessionId = 0
  let lifecycleId = 0
  let destroyed = false
  const activeImageLoads = new Set<() => void>()

  // 🔴 优化1：缓存帧间隔，避免在 rAF 热路径中重复读取 reactive 属性并计算
  let frameInterval = 1000 / fps

  // 🟠 优化2：布局参数缓存，key 为 "imgW×imgH@canvasW×canvasH"
  const drawParamsCache = new Map<string, DrawParams>()

  const settleCompletion = (runCallback = false) => {
    const callback = onCompleteCallback
    const resolve = resolveCompletion

    onCompleteCallback = null
    resolveCompletion = null

    if (runCallback && callback) {
      try {
        callback()
      } catch (error) {
        console.error('回调函数执行出错:', error)
      }
    }

    resolve?.()
  }

  const cancelAnimationLoop = (invalidateSession = true) => {
    if (invalidateSession) {
      playbackSessionId++
    }

    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  const finishPlayback = (runCallback = false) => {
    playbackRequestId++
    state.isPlaying = false
    targetFrame = null
    cancelAnimationLoop()
    settleCompletion(runCallback)
  }

  const createCompletionPromise = (onComplete?: () => void): Promise<void> => {
    settleCompletion(false)
    onCompleteCallback = onComplete ?? null

    return new Promise((resolve) => {
      resolveCompletion = resolve
    })
  }

  /**
   * 计算绘制参数，优先从缓存中读取。
   * 相同尺寸的 canvas + 图片组合只需计算一次。
   */
  const computeDrawParams = (
    imgWidth: number,
    imgHeight: number,
    canvasWidth: number,
    canvasHeight: number,
  ): DrawParams => {
    const cacheKey = `${imgWidth}x${imgHeight}@${canvasWidth}x${canvasHeight}`
    const cached = drawParamsCache.get(cacheKey)
    if (cached) return cached

    let sourceX = 0
    let sourceY = 0
    let sourceWidth = imgWidth
    let sourceHeight = imgHeight
    let destX = 0
    let destY = 0
    let destWidth = canvasWidth
    let destHeight = canvasHeight

    switch (objectFit) {
      case 'contain': {
        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
        destWidth = imgWidth * scale
        destHeight = imgHeight * scale
        destX = (canvasWidth - destWidth) / 2
        destY = (canvasHeight - destHeight) / 2
        break
      }
      case 'cover': {
        const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight)
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale
        if (scaledWidth > canvasWidth) {
          sourceWidth = canvasWidth / scale
          sourceX = (imgWidth - sourceWidth) / 2
        }
        if (scaledHeight > canvasHeight) {
          sourceHeight = canvasHeight / scale
          sourceY = (imgHeight - sourceHeight) / 2
        }
        break
      }
      case 'fill': {
        // 拉伸填满，不保持宽高比，使用默认值即可
        break
      }
      case 'none': {
        destWidth = imgWidth
        destHeight = imgHeight
        destX = (canvasWidth - destWidth) / 2
        destY = (canvasHeight - destHeight) / 2

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

    const params: DrawParams = { sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight }
    drawParamsCache.set(cacheKey, params)
    return params
  }

  // 并发加载图片，由浏览器自行调度请求
  const loadImages = async (
    items: Array<{ frame: string | HTMLImageElement; index: number }>,
    sessionId: number,
  ): Promise<Array<HTMLImageElement | null>> => {
    const waitForImage = (img: HTMLImageElement, src?: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const finish = (value: HTMLImageElement | null) => {
          img.removeEventListener('load', onLoad)
          img.removeEventListener('error', onError)
          activeImageLoads.delete(cancel)
          resolve(value)
        }
        const onLoad = () => finish(img.naturalWidth > 0 ? img : null)
        const onError = () => finish(null)
        const cancel = () => {
          finish(null)
          if (src !== undefined) img.removeAttribute('src')
        }

        if (src === undefined && img.complete) {
          onLoad()
          return
        }
        activeImageLoads.add(cancel)
        img.addEventListener('load', onLoad)
        img.addEventListener('error', onError)
        if (src !== undefined) img.src = src
      })

    return Promise.all(
      items.map(async ({ frame, index }) => {
        let img: HTMLImageElement | null
        if (typeof frame === 'string') {
          img = await waitForImage(new Image(), frame)
          for (let attempt = 1; !img && attempt <= 2 && !destroyed && sessionId === loadingSessionId; attempt++) {
            let retryUrl: URL
            try {
              retryUrl = new URL(frame, document.baseURI)
            } catch {
              break
            }
            if (!['http:', 'https:'].includes(retryUrl.protocol)) break
            retryUrl.searchParams.set('retry', String(attempt))
            img = await waitForImage(new Image(), retryUrl.href)
          }
        } else {
          img = await waitForImage(frame)
        }
        if (destroyed || sessionId !== loadingSessionId) return null
        state.loadProgress = ++loadedCount / frames.length
        images[index] = img
        if (img && index === validCoverFrame) drawFrame(validCoverFrame)
        return img
      }),
    )
  }

  const preloadImagesInternal = async (suppressAutoplay: boolean): Promise<Array<HTMLImageElement | null>> => {
    const sessionId = ++loadingSessionId
    const currentPlaybackRequestId = playbackRequestId
    loadedCount = 0

    try {
      const frameList = frames.map((frame, index) => ({ frame, index }))

      // 封面帧排在最前，加载完成后会立即绘制
      const coverItem = frameList[validCoverFrame]
      const otherItems = frameList.filter((_, i) => i !== validCoverFrame)
      const results: Array<HTMLImageElement | null> = Array.from({ length: frames.length }, () => null)
      const loadItems = [coverItem, ...otherItems]
      const loadedImages = await loadImages(loadItems, sessionId)

      if (destroyed || sessionId !== loadingSessionId) return results

      loadedImages.forEach((img, index) => {
        const frameIndex = loadItems[index].index
        results[frameIndex] = img
        images[frameIndex] = img
      })

      if (destroyed || sessionId !== loadingSessionId) return results

      if (!results.some((img) => img !== null)) {
        throw new Error('Failed to load any frame')
      }

      state.isLoaded = true
      images = results

      if (autoplay && !state.isPlaying && !suppressAutoplay && currentPlaybackRequestId === playbackRequestId) {
        play(validStartFrame)
      }

      return results
    } catch (error) {
      if (sessionId === loadingSessionId) loadingPromise = null
      console.error('Failed to preload all images:', error)
      throw error
    }
  }

  // 🟡 优化6：loadingPromise 完成后不清空引用，改用 state.isLoaded 短路，避免重复加载
  const preloadImages = async (): Promise<Array<HTMLImageElement | null>> => {
    if (state.isLoaded) return Promise.resolve(images)
    if (!loadingPromise) {
      loadingPromise = preloadImagesInternal(false)
    }
    return loadingPromise
  }

  const ensureLoadedForPlayback = async () => {
    if (state.isLoaded) return
    if (!loadingPromise) {
      loadingPromise = preloadImagesInternal(true)
    }
    await loadingPromise
  }

  const getRenderableImage = (frameIndex: number) => {
    const current = images[frameIndex]
    if (current) return current

    for (let offset = 1; offset < frames.length; offset++) {
      const prev = images[frameIndex - offset]
      if (prev) return prev

      const next = images[frameIndex + offset]
      if (next) return next
    }

    return null
  }

  // 绘制当前帧
  const drawFrame = (frameIndex: number) => {
    if (!ctx || frameIndex < 0 || frameIndex >= frames.length) return

    const img = getRenderableImage(frameIndex)
    if (!img || !canvas.value) return

    const canvasWidth = canvas.value.width
    const canvasHeight = canvas.value.height
    const imgWidth = img.naturalWidth || img.width
    const imgHeight = img.naturalHeight || img.height

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 🟠 优化2：从缓存获取布局参数，避免每帧重算
    const { sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight } = computeDrawParams(
      imgWidth,
      imgHeight,
      canvasWidth,
      canvasHeight,
    )

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
  const animate = (currentTime: number, sessionId: number) => {
    if (!state.isPlaying || sessionId !== playbackSessionId) return

    // 🔴 优化1：使用缓存的 frameInterval，不再访问 reactive 属性
    if (currentTime - lastFrameTime >= frameInterval) {
      let nextFrame = state.currentFrame + 1

      if (targetFrame !== null) {
        if (nextFrame >= frames.length) {
          finishPlayback(true)
          return
        }
      } else {
        if (nextFrame > validLoopEnd) {
          if (loop) {
            if (loopCount >= 0 && state.completedLoops >= loopCount) {
              state.currentFrame = validCoverFrame
              state.completedLoops = 0
              drawFrame(state.currentFrame)
              finishPlayback(true)
              return
            }
            nextFrame = validLoopStart
            state.completedLoops++
          } else {
            state.currentFrame = validCoverFrame
            state.completedLoops = 0
            drawFrame(state.currentFrame)
            finishPlayback(true)
            return
          }
        }
      }

      drawFrame(nextFrame)
      lastFrameTime = currentTime - ((currentTime - lastFrameTime) % frameInterval)

      if (targetFrame !== null && state.currentFrame >= targetFrame) {
        finishPlayback(true)
        return
      }
    }

    animationId = requestAnimationFrame((time) => animate(time, sessionId))
  }

  // 播放控制方法
  const play = async (fromFrame?: number, onComplete?: () => void): Promise<void> => {
    const currentLifecycleId = lifecycleId
    const currentPlaybackRequestId = ++playbackRequestId

    try {
      await ensureLoadedForPlayback()
    } catch (error) {
      console.error('Failed to preload all images:', error)
      return
    }

    if (destroyed || currentLifecycleId !== lifecycleId || currentPlaybackRequestId !== playbackRequestId) return

    if (typeof fromFrame === 'number') {
      state.currentFrame = clampFrame(fromFrame)
      drawFrame(state.currentFrame)
    }

    if (loop) {
      targetFrame = null
    } else {
      targetFrame = frames.length - 1
    }

    const completionPromise = createCompletionPromise(onComplete)

    if (targetFrame !== null && state.currentFrame >= targetFrame) {
      finishPlayback(true)
      return completionPromise
    }

    cancelAnimationLoop(false)
    playbackSessionId++
    state.isPlaying = true
    lastFrameTime = performance.now()
    animationId = requestAnimationFrame((time) => animate(time, playbackSessionId))

    return completionPromise
  }

  const pause = () => {
    finishPlayback(false)
  }

  const stop = () => {
    finishPlayback(false)
    state.currentFrame = validCoverFrame
    state.completedLoops = 0
    drawFrame(state.currentFrame)
  }

  const goToFrame = (frameIndex: number) => {
    const targetFrameIndex = clampFrame(frameIndex)
    drawFrame(targetFrameIndex)
  }

  const goToAndPlay = (frameIndex: number, onComplete?: () => void): Promise<void> => {
    goToFrame(frameIndex)
    return play(frameIndex, onComplete)
  }

  const goToAndStop = (frameIndex: number) => {
    stop()
    goToFrame(frameIndex)
  }

  const playToFrame = async (endFrame: number, onComplete?: () => void): Promise<void> => {
    const currentLifecycleId = lifecycleId
    const currentPlaybackRequestId = ++playbackRequestId

    try {
      await ensureLoadedForPlayback()
    } catch (error) {
      console.error('Failed to preload all images:', error)
      return
    }

    if (destroyed || currentLifecycleId !== lifecycleId || currentPlaybackRequestId !== playbackRequestId) return

    const validEndFrame = clampFrame(endFrame)

    if (validEndFrame <= state.currentFrame) {
      finishPlayback()
      goToFrame(validEndFrame)
      onComplete?.()
      return
    }

    targetFrame = validEndFrame
    const completionPromise = createCompletionPromise(onComplete)

    cancelAnimationLoop(false)
    playbackSessionId++
    state.isPlaying = true
    lastFrameTime = performance.now()
    animationId = requestAnimationFrame((time) => animate(time, playbackSessionId))

    return completionPromise
  }

  const playFromToFrame = async (startFrame: number, endFrame: number, onComplete?: () => void): Promise<void> => {
    const currentLifecycleId = lifecycleId
    const currentPlaybackRequestId = ++playbackRequestId
    try {
      await ensureLoadedForPlayback()
    } catch (error) {
      console.error('Failed to preload all images:', error)
      return
    }
    if (destroyed || currentLifecycleId !== lifecycleId || currentPlaybackRequestId !== playbackRequestId) return
    goToFrame(startFrame)
    return playToFrame(endFrame, onComplete)
  }

  const reset = () => {
    stop()
    state.completedLoops = 0
    goToFrame(validCoverFrame)
  }

  // 🔴 优化1：setFps 同步更新缓存的帧间隔
  const setFps = (newFps: number) => {
    if (!Number.isFinite(newFps) || newFps <= 0) {
      console.warn('fps must be a finite number greater than 0')
      return
    }
    state.currentFps = newFps
    frameInterval = 1000 / newFps
  }

  /** 重新适配 canvas 分辨率并重绘当前帧（在 resize 或手动调用时使用） */
  const resizeCanvas = () => {
    if (!canvas.value) return
    const w = parseFloat(getComputedStyle(canvas.value).width)
    const h = parseFloat(getComputedStyle(canvas.value).height)
    canvas.value.width = w * window.devicePixelRatio
    canvas.value.height = h * window.devicePixelRatio
    // canvas 尺寸变了，已缓存的布局参数失效，清空缓存
    drawParamsCache.clear()
    drawFrame(state.currentFrame)
  }

  // 初始化
  const init = async () => {
    const currentPlaybackRequestId = playbackRequestId
    try {
      destroyed = false

      if (!canvas.value) {
        throw new Error('Canvas element not found')
      }

      ctx = canvas.value.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get 2D context')
      }

      // 开始预加载（异步进行，封面帧会优先加载完成后立即显示）
      if (state.isLoaded) drawFrame(state.currentFrame)
      else preloadImages().catch(console.error)

      if (state.isLoaded && autoplay && currentPlaybackRequestId === playbackRequestId) {
        play(validStartFrame)
      }
    } catch (error) {
      console.error('Failed to initialize frame animation:', error)
      throw error
    }
  }

  // 🟡 优化4：destroy 释放 ctx 引用，防止内存泄漏
  const destroy = () => {
    destroyed = true
    lifecycleId++
    loadingSessionId++
    activeImageLoads.forEach((cancel) => cancel())
    activeImageLoads.clear()
    pause()
    ctx = null
    images = []
    loadedCount = 0
    state.isLoaded = false
    state.loadProgress = 0
    state.completedLoops = 0
    loadingPromise = null
    drawParamsCache.clear()
  }

  // 生命周期处理
  onMounted(() => {
    if (canvas.value) {
      const width = getComputedStyle(canvas.value).width
      const height = getComputedStyle(canvas.value).height
      canvas.value.width = parseFloat(width) * window.devicePixelRatio
      canvas.value.height = parseFloat(height) * window.devicePixelRatio
      init().catch(console.error)

      // 🟡 优化5：监听容器尺寸变化，自动重设分辨率并重绘
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas()
        })
        resizeObserver.observe(canvas.value)
      } else {
        window.addEventListener('resize', resizeCanvas)
      }
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas)
    resizeObserver?.disconnect()
    resizeObserver = null
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
    resizeCanvas,

    // 工具方法
    preloadImages,
    drawFrame,
  }
}

export default useCanvasFrameAnimation

export function createFrameList(prefix: string, count: number, extension = 'png'): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}.${extension}`)
}
