import { toFixedNumber } from '@/utils/convert'
import { computed, onDeactivated, onUnmounted, ref } from 'vue'

export interface UseTimerOptions {
  /** 初始倒计时时间（秒） */
  initialTime?: number
  /** 倒计时结束时的文本 */
  idleText?: string
  /** 倒计时进行中的文本模板，{time} 会被替换为当前时间 */
  countdownTextTemplate?: string
  /** 倒计时间隔（毫秒） */
  interval?: number
}

export function useTimer(options: UseTimerOptions | number = {}) {
  const config = typeof options === 'number' ? { initialTime: options } : options

  const { initialTime = 60, idleText = '获取验证码', countdownTextTemplate = '{time}秒', interval = 1000 } = config

  // 参数验证
  if (initialTime <= 0) {
    throw new Error('initialTime must be greater than 0')
  }

  const currentTime = ref(initialTime)
  const timerId = ref<number | undefined>(undefined)

  // 通过计算属性推导活跃状态
  const isActive = computed(() => timerId.value !== undefined)

  // 计算属性，避免不必要的响应式更新
  const timerText = computed(() => {
    return isActive.value ? countdownTextTemplate.replace('{time}', currentTime.value.toString()) : idleText
  })

  const sending = computed(() => isActive.value)
  const progress = computed(() => toFixedNumber((initialTime - currentTime.value) / initialTime, 2))
  const percentage = computed(() => toFixedNumber((currentTime.value / initialTime) * 100, 2))

  // 重置定时器状态
  const resetTimer = () => {
    if (timerId.value !== undefined) {
      clearInterval(timerId.value)
      timerId.value = undefined
    }
    currentTime.value = initialTime
  }

  const startTimer = (): void => {
    if (isActive.value) return

    currentTime.value = initialTime

    timerId.value = window.setInterval(() => {
      currentTime.value--

      if (currentTime.value <= 0) {
        resetTimer()
      }
    }, interval)
  }

  const stopTimer = () => {
    resetTimer()
  }

  // 暂停定时器（保持当前状态）
  const pauseTimer = () => {
    if (timerId.value !== undefined) {
      clearInterval(timerId.value)
      timerId.value = undefined
    }
  }

  // 恢复定时器
  const resumeTimer = () => {
    if (isActive.value || currentTime.value <= 0) return

    timerId.value = window.setInterval(() => {
      currentTime.value--

      if (currentTime.value <= 0) {
        resetTimer()
      }
    }, interval)
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    resetTimer()
  })

  // 组件失活时清理定时器
  onDeactivated(() => {
    resetTimer()
  })

  return {
    // 状态
    sending,
    timerText,
    currentTime,
    progress,
    percentage,

    // 方法
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  }
}
