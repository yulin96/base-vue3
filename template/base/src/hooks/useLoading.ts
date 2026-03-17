import { computed, onBeforeUnmount, onDeactivated, onUnmounted, readonly, shallowRef } from 'vue'

export function useLoading(imgList: string[], next?: () => void, delay: number = 300) {
  let timer: number | undefined
  const progressValue = shallowRef(0)
  const images: HTMLImageElement[] = []

  // 简化计算逻辑，避免重复计算
  const count = computed(() => {
    if (imgList.length === 0) return 0
    const percentage = (progressValue.value / imgList.length) * 100
    return Math.min(percentage, 100)
  })

  const cleanup = () => {
    // 清理定时器
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    // 清理图片事件监听器
    images.forEach((img) => {
      img.onload = null
      img.onerror = null
    })
    images.length = 0
  }

  const start = () => {
    // 重置状态
    progressValue.value = 0
    cleanup()

    if (imgList.length === 0) {
      next?.()
      return
    }

    let loadedCount = 0

    for (const imgSrc of imgList) {
      const image = new Image()
      images.push(image)

      const handleLoad = () => {
        loadedCount++
        progressValue.value = loadedCount

        if (loadedCount >= imgList.length) {
          timer = window.setTimeout(() => {
            next?.()
          }, delay)
        }
      }

      image.onload = handleLoad
      image.onerror = handleLoad // 失败也算作已处理
      image.src = imgSrc
    }
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return { count, start, cleanup }
}

export function useAutoLoading(speed: number = 20, next?: () => void) {
  const count = shallowRef(0)
  let intervalId: NodeJS.Timeout | undefined

  const start = () => {
    stop() // 先停止之前的定时器
    count.value = 0

    intervalId = setInterval(() => {
      count.value++
      if (count.value >= 100) {
        stop()
        next?.()
      }
    }, speed)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = undefined
    }
  }

  const cleanup = () => {
    stop()
  }

  // 自动开始
  start()

  onUnmounted(cleanup)
  onDeactivated(cleanup)

  return {
    count: readonly(count),
    start,
    stop,
    cleanup,
  }
}
