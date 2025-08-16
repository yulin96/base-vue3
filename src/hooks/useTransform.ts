import { v4 } from 'uuid'
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

type TransformOptions = {
  scale?: {
    default?: number
    min?: number
    max?: number
  }

  position?: {
    x?: number
    y?: number
  }
}

export function useTransform(options: TransformOptions) {
  const key = v4()

  const { scale, position } = options
  const { default: defaultScale = 1, min: minScale = 1, max: maxScale = 5 } = scale || {}
  const { x: defaultX = 0, y: defaultY = 0 } = position || {}
  const defaultPosition = { x: defaultX, y: defaultY }

  const moveElement = useTemplateRef<HTMLElement>(key)
  let containerElement: HTMLElement | null = null

  // 保存当前位置和缩放值
  let positionMark = { x: defaultPosition.x, y: defaultPosition.y }
  let scaleMark = defaultScale

  // 记录触摸开始时的位置和状态
  let startX = 0
  let startY = 0
  let startDistance = 0
  let startScale = 1
  const isDragging = ref(false)
  const isScaling = ref(false)

  // 添加一个新变量跟踪是否真正发生了拖动（移动超过阈值）
  let hasMoved = false
  const movementThreshold = 10 // 超过这个阈值就不算点击事件
  let movedDistance = 0

  let pinchStartCompositionX = 0
  let pinchStartCompositionY = 0

  const lastTapTime = 0
  const DOUBLE_TAP_DELAY = 300

  // 一个变量用于跟踪拖动后阻止点击的计时器
  let preventClickTimer: number | null = null

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()

    // 确保元素和容器元素都存在
    if (!moveElement.value || !containerElement) return

    // 获取容器的边界矩形
    const containerRect = containerElement.getBoundingClientRect()

    // 计算鼠标相对于容器的位置
    const mouseXInContainer = e.clientX - containerRect.left
    const mouseYInContainer = e.clientY - containerRect.top

    // 计算鼠标在元素原始坐标系中的位置
    // 将鼠标位置从容器坐标系转换到未缩放的元素坐标系
    const mouseXInElement = (mouseXInContainer - positionMark.x) / scaleMark
    const mouseYInElement = (mouseYInContainer - positionMark.y) / scaleMark

    // 确定缩放因子 - 根据需要调整灵敏度
    const zoomIntensity = 0.1
    const delta = e.deltaY > 0 ? -1 : 1 // deltaY 为负表示放大，为正表示缩小
    let newScale = scaleMark * (1 + delta * zoomIntensity)

    newScale = Math.min(Math.max(newScale, minScale), maxScale)

    if (newScale === scaleMark) {
      return // 缩放比例没有变化（例如，达到最小/最大限制）
    }

    // 计算新位置以保持鼠标下方的点静止
    // 公式：新位置 = 鼠标位置 - 元素中鼠标位置 * 新缩放比例
    const newX = mouseXInContainer - mouseXInElement * newScale
    const newY = mouseYInContainer - mouseYInElement * newScale

    scaleMark = newScale
    positionMark = getBoundedPosition(newX, newY)

    updateItemPosition()
  }

  // 处理鼠标按下事件
  const handleMouseDown = (e: MouseEvent) => {
    // 只处理左键点击
    if (e.button !== 0) return

    // 重置移动状态
    hasMoved = false
    movedDistance = 0

    isDragging.value = true
    isScaling.value = false
    startX = e.clientX - positionMark.x
    startY = e.clientY - positionMark.y

    // 添加鼠标移动和释放事件监听（在document上，以便能捕获鼠标释放）
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 处理鼠标移动事件
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    e.preventDefault()

    const newX = e.clientX - startX
    const newY = e.clientY - startY

    // 计算移动距离用于判断是否真的是拖动
    const dx = newX - positionMark.x
    const dy = newY - positionMark.y
    movedDistance += Math.sqrt(dx * dx + dy * dy)

    // 如果移动距离超过阈值，标记为真正的拖动
    if (movedDistance >= movementThreshold) {
      hasMoved = true
    }

    // 设置新位置，并限制边界
    const boundedPosition = getBoundedPosition(newX, newY)
    positionMark = boundedPosition

    updateItemPosition()
  }

  // 处理鼠标释放事件
  const handleMouseUp = (e: MouseEvent) => {
    // 先清除之前可能存在的阻止点击计时器
    if (preventClickTimer !== null) {
      clearTimeout(preventClickTimer)
      preventClickTimer = null
    }

    // 获取当前是否真正拖动的状态
    const wasMoving = hasMoved

    // 结束拖动状态
    isDragging.value = false

    // 移除文档级事件监听器
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // 如果发生了真正的拖动，设置拦截点击事件
    if (wasMoving) {
      // 立即拦截可能的点击事件
      document.addEventListener('click', preventClickAfterDrag, { capture: true, once: true })

      // 设置重置状态的计时器
      preventClickTimer = window.setTimeout(() => {
        hasMoved = false
        preventClickTimer = null
      }, 300) // 300毫秒后重置状态，此时点击应该已被处理
    }

    // 确保元素在边界内
    const boundedPosition = getBoundedPosition(positionMark.x, positionMark.y)
    if (boundedPosition.x !== positionMark.x || boundedPosition.y !== positionMark.y) {
      positionMark = boundedPosition
      updateItemPosition()
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    const touches = e.touches
    // const now = Date.now()
    // if (now - lastTapTime < DOUBLE_TAP_DELAY && touches.length === 1) {
    //   resetPosition()
    //   lastTapTime = 0
    //   return
    // }
    // lastTapTime = now

    // 重置移动状态
    hasMoved = false
    movedDistance = 0

    if (touches.length === 1) {
      // 单指操作 - 准备拖动
      const touch = getSafeTouch(touches, 0)
      if (!touch) return

      isDragging.value = true
      isScaling.value = false
      startX = touch.clientX - positionMark.x
      startY = touch.clientY - positionMark.y
    } else if (touches.length === 2) {
      // 双指操作 - 准备缩放
      const touch1 = getSafeTouch(touches, 0)
      const touch2 = getSafeTouch(touches, 1)
      if (!touch1 || !touch2) return

      isDragging.value = false
      isScaling.value = true
      startDistance = getDistance(touch1, touch2)
      startScale = scaleMark

      // 计算双指中心点在视口中的位置
      const pinchX = (touch1.clientX + touch2.clientX) / 2
      const pinchY = (touch1.clientY + touch2.clientY) / 2

      // 计算双指中心点在元素自身坐标系（未缩放）下的位置
      pinchStartCompositionX = (pinchX - positionMark.x) / scaleMark
      pinchStartCompositionY = (pinchY - positionMark.y) / scaleMark
    }
  }

  // 处理触摸移动事件
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value && !isScaling.value) return

    e.preventDefault() // <- 在move事件中调用，以阻止拖动/缩放时的页面滚动等默认行为
    const touches = e.touches

    if (isDragging.value && touches.length === 1) {
      // 单指拖动
      const touch = getSafeTouch(touches, 0)
      if (!touch) return

      const newX = touch.clientX - startX
      const newY = touch.clientY - startY

      // 计算移动距离用于判断是否真的是拖动
      const dx = newX - positionMark.x
      const dy = newY - positionMark.y
      movedDistance += Math.sqrt(dx * dx + dy * dy)

      // 如果移动距离超过阈值，标记为真正的拖动
      if (movedDistance >= movementThreshold) {
        hasMoved = true
      }

      // 设置新位置，并限制边界
      const boundedPosition = getBoundedPosition(newX, newY)
      positionMark = boundedPosition

      updateItemPosition()
    } else if (isScaling.value && touches.length === 2) {
      // 标记为已移动，因为缩放也应该阻止点击
      hasMoved = true

      // 双指缩放
      const touch1 = getSafeTouch(touches, 0)
      const touch2 = getSafeTouch(touches, 1)
      if (!touch1 || !touch2) return

      const currentDistance = getDistance(touch1, touch2)
      let newScale = startScale * (currentDistance / startDistance)
      newScale = Math.min(Math.max(newScale, minScale), maxScale) // 使用配置的最小最大缩放值

      // 当前双指中心点在视口中的位置
      const currentPinchX = (touch1.clientX + touch2.clientX) / 2
      const currentPinchY = (touch1.clientY + touch2.clientY) / 2

      // 我们希望 pinchStartCompositionX 这个点在缩放后的新视口位置仍然是 currentPinchX
      const newX = currentPinchX - pinchStartCompositionX * newScale
      const newY = currentPinchY - pinchStartCompositionY * newScale

      scaleMark = newScale

      // 设置新位置，并限制边界
      const boundedPosition = getBoundedPosition(newX, newY)
      positionMark = boundedPosition

      updateItemPosition()
    }
  }

  // 处理触摸结束事件
  const handleTouchEnd = (e: TouchEvent) => {
    // 先清除之前可能存在的阻止点击计时器
    if (preventClickTimer !== null) {
      clearTimeout(preventClickTimer)
      preventClickTimer = null
    }

    // 获取当前是否真正拖动的状态
    const wasMoving = hasMoved

    // 结束拖动和缩放状态
    isDragging.value = false
    isScaling.value = false

    // 如果发生了真正的拖动，设置拦截点击事件
    if (wasMoving) {
      // 立即拦截可能的点击事件
      document.addEventListener('click', preventClickAfterDrag, { capture: true, once: true })
      document.addEventListener('touchend', preventClickAfterDrag, { capture: true, once: true })

      // 设置重置状态的计时器
      preventClickTimer = window.setTimeout(() => {
        hasMoved = false
        preventClickTimer = null
      }, 300) // 300毫秒后重置状态，此时点击应该已被处理
    }

    // 确保元素在边界内
    const boundedPosition = getBoundedPosition(positionMark.x, positionMark.y)
    if (boundedPosition.x !== positionMark.x || boundedPosition.y !== positionMark.y) {
      positionMark = boundedPosition
      updateItemPosition()
    }
  }

  // 安全获取触摸点
  const getSafeTouch = (touches: TouchList, index: number): Touch | null => {
    return touches[index] ? touches[index] : null
  }

  // 计算两个触摸点之间的距离
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 更新item元素的位置和缩放
  const updateItemPosition = () => {
    if (!moveElement.value) return
    moveElement.value.style.transform = `translate(${positionMark.x}px, ${positionMark.y}px) scale(${scaleMark})`
  }

  // 获取边界限制后的位置
  const getBoundedPosition = (x: number, y: number) => {
    if (!containerElement || !moveElement.value) return { x, y }

    const boxRect = containerElement.getBoundingClientRect()
    const itemRect = moveElement.value.getBoundingClientRect()

    // 计算边界
    const scaledWidth = itemRect.width
    const scaledHeight = itemRect.height

    // 盒子的尺寸
    const boxWidth = boxRect.width
    const boxHeight = boxRect.height

    // 限制x坐标，确保item不会超出box
    const minX = boxWidth - scaledWidth
    const maxX = 0
    const boundedX = Math.min(Math.max(x, minX), maxX)

    // 限制y坐标，确保item不会超出box
    const minY = boxHeight - scaledHeight
    const maxY = 0
    const boundedY = Math.min(Math.max(y, minY), maxY)

    return { x: boundedX, y: boundedY }
  }

  // 重置位置和缩放
  const resetPosition = () => {
    scaleMark = defaultScale
    positionMark = { x: defaultPosition.x, y: defaultPosition.y }
    updateItemPosition()
  }

  onMounted(() => {
    if (!moveElement.value) return
    containerElement = moveElement.value.parentElement
    if (!containerElement) return
    containerElement.style.overflow = 'hidden'
    containerElement.style.position = 'relative'
    containerElement.style.touchAction = 'none'
    containerElement.style.userSelect = 'none'

    moveElement.value.style.transformOrigin = 'top left'
    moveElement.value.style.position = 'relative'
    moveElement.value.style.touchAction = 'none'
    moveElement.value.style.userSelect = 'none'

    // 应用默认位置
    positionMark = { x: defaultPosition.x, y: defaultPosition.y }
    updateItemPosition()

    moveElement.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    moveElement.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    moveElement.value.addEventListener('touchend', handleTouchEnd)
    moveElement.value.addEventListener('wheel', handleWheel, { passive: false })
    moveElement.value.addEventListener('mousedown', handleMouseDown)
  })

  onBeforeUnmount(() => {
    if (!moveElement.value) return

    moveElement.value.removeEventListener('touchstart', handleTouchStart)
    moveElement.value.removeEventListener('touchmove', handleTouchMove)
    moveElement.value.removeEventListener('touchend', handleTouchEnd)
    moveElement.value.removeEventListener('wheel', handleWheel)
    moveElement.value.removeEventListener('mousedown', handleMouseDown)
  })

  // 点击拦截函数 - 用于拖动后阻止点击
  const preventClickAfterDrag = (e: MouseEvent | TouchEvent) => {
    // 只有在确认是拖动后才阻止点击
    if (hasMoved) {
      e.stopPropagation()
      e.preventDefault()

      isDragging.value = false
      isScaling.value = false
    }
  }

  return { isDragging, isScaling, key }
}
