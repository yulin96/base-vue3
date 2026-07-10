import { computed, onBeforeUnmount, shallowRef } from 'vue'

/**
 * 闲时分批图片预加载 Hook
 * @param imgList 待加载的图片链接列表
 * @param next 所有图片加载完成后的回调函数
 * @param delay 加载完成后的延迟回调时间（毫秒）
 * @param batchSize 每次浏览器空闲时加载的图片批次大小
 */
export function useIdleLoading(imgList: string[], next?: () => void, delay: number = 300, batchSize: number = 3) {
  let timer: number | undefined
  let scheduledTask: number | undefined
  let scheduledWithIdleCallback = false
  let loadingSessionId = 0
  const progressValue = shallowRef(0)
  const images: HTMLImageElement[] = []

  // 加载进度百分比
  const count = computed(() => {
    if (imgList.length === 0) return 0
    const percentage = (progressValue.value / imgList.length) * 100
    return Math.min(percentage, 100)
  })

  const cleanup = () => {
    loadingSessionId++

    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }

    if (scheduledTask !== undefined) {
      if (scheduledWithIdleCallback) cancelIdleCallback(scheduledTask)
      else clearTimeout(scheduledTask)
      scheduledTask = undefined
    }

    images.forEach((img) => {
      img.onload = null
      img.onerror = null
    })
    images.length = 0
  }

  const start = () => {
    cleanup()
    progressValue.value = 0
    const currentSessionId = loadingSessionId

    if (imgList.length === 0) {
      next?.()
      return
    }

    let loadedCount = 0
    let index = 0

    const scheduleNextBatch = () => {
      if (currentSessionId !== loadingSessionId) return

      if (typeof requestIdleCallback !== 'undefined') {
        scheduledWithIdleCallback = true
        scheduledTask = requestIdleCallback(() => {
          scheduledTask = undefined
          loadNextBatch()
        })
      } else {
        scheduledWithIdleCallback = false
        scheduledTask = window.setTimeout(() => {
          scheduledTask = undefined
          loadNextBatch()
        }, 100)
      }
    }

    const loadNextBatch = () => {
      if (currentSessionId !== loadingSessionId) return

      const limit = Math.min(index + batchSize, imgList.length)

      for (; index < limit; index++) {
        const image = new Image()
        images.push(image)

        const handleLoad = () => {
          if (currentSessionId !== loadingSessionId) return

          loadedCount++
          progressValue.value = loadedCount

          if (loadedCount >= imgList.length) {
            timer = window.setTimeout(() => {
              next?.()
            }, delay)
          }
        }

        image.onload = handleLoad
        image.onerror = handleLoad // 失败也算作已加载，防止卡死
        image.src = imgList[index]
      }

      // 若还有剩余未加载的，继续在下一次空闲时间加载
      if (index < imgList.length) {
        scheduleNextBatch()
      }
    }

    // 在首次浏览器空闲时启动分批加载
    scheduleNextBatch()
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return { count, start, cleanup }
}
