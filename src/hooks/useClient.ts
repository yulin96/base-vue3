import { useDocumentVisibility } from '@vueuse/core'
import { onBeforeUnmount, readonly, ref, shallowRef, watch } from 'vue'

// ROP客户端类型定义
interface ROPClient {
  On: (event: string, callback: (data: any, topic: string) => void) => void
  Enter: (pub: string, sub: string, suid: string, boolean: boolean) => void
  Subscribe: (topic: string) => void
  Publish: (topic: string, message: string) => void
}

// 为ROP全局对象定义类型
declare global {
  interface Window {
    ROP: ROPClient
  }
}

// 连接状态类型
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

// 配置选项接口
export interface UseClientOptions {
  retryDelay?: number
  maxRetries?: number
  scriptUrl?: string
  autoReconnectOnVisibility?: boolean
}

/**
 * ROP客户端连接钩子
 * @param subScribes 订阅的主题，可以是字符串或字符串数组
 * @param pub 发布频道
 * @param sub 订阅频道
 * @param options 配置选项
 * @returns 包含接收数据、连接状态和控制方法的响应式引用
 */
export const useClient = <T = any>(
  subScribes: Array<string> | string,
  pub: string,
  sub: string,
  options: UseClientOptions = {},
) => {
  const {
    retryDelay = 1200,
    maxRetries = 100,
    scriptUrl = 'https://cdn.aodianyun.com/dms/rop_client.js',
    autoReconnectOnVisibility = true,
  } = options

  const subIsString = typeof subScribes === 'string'
  const data = shallowRef<T>()
  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const retryCount = ref(0)

  // 定时器引用，用于清理
  let retryTimer: number | undefined
  let visibilityWatcher: (() => void) | null = null

  // 生成唯一会话ID
  const generateSessionId = () => `suid_${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`

  // 清理定时器
  const clearRetryTimer = () => {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = undefined
    }
  }

  // 延迟重连
  const scheduleRetry = () => {
    if (retryCount.value >= maxRetries) {
      console.error(`连接失败，已达到最大重试次数: ${maxRetries}`)
      connectionStatus.value = 'error'
      return
    }

    clearRetryTimer()
    connectionStatus.value = 'reconnecting'
    retryCount.value++

    retryTimer = window.setTimeout(() => {
      linkROP()
    }, retryDelay)
  }

  // 连接函数
  const linkROP = () => {
    if (!window.ROP) {
      console.error('ROP 客户端未就绪')
      return
    }

    try {
      connectionStatus.value = 'connecting'

      // 进入频道
      window.ROP.Enter(pub, sub, generateSessionId(), true)
    } catch (error) {
      console.error('连接失败:', error)
      scheduleRetry()
    }
  }

  // 手动重连方法
  const reconnect = () => {
    retryCount.value = 0
    clearRetryTimer()
    linkROP()
  }

  // 事件处理函数注册
  const setupEventHandlers = () => {
    const ROP = window.ROP

    ROP.On('enter_suc', () => {
      console.log('连接成功')
      connectionStatus.value = 'connected'
      retryCount.value = 0
      clearRetryTimer()

      if (subIsString) {
        window.ROP.Subscribe(subScribes as string)
      } else {
        ;(subScribes as string[]).forEach((topic) => window.ROP.Subscribe(topic))
      }
    })

    ROP.On('reconnect', () => {
      console.log('重连中')
      connectionStatus.value = 'reconnecting'
    })

    ROP.On('offline', (err: string) => {
      console.error('离线状态:', err)
      connectionStatus.value = 'disconnected'
      scheduleRetry()
    })

    ROP.On('enter_fail', (err: string) => {
      console.error('登录失败:', err)
      connectionStatus.value = 'error'
      scheduleRetry()
    })

    ROP.On('publish_data', (message: any, topic: string) => {
      // 只处理订阅的主题消息
      if ((subIsString ? topic === subScribes : subScribes.includes(topic)) && message) {
        try {
          // 尝试解析JSON，如果失败则直接使用原始消息
          let parsedMessage: any
          if (typeof message === 'string') {
            try {
              parsedMessage = JSON.parse(message)
            } catch {
              parsedMessage = message
            }
          } else {
            parsedMessage = message
          }

          // 数据类型检查和设置
          if (parsedMessage !== null && parsedMessage !== undefined) {
            data.value = parsedMessage as T
          }
        } catch (error) {
          console.error('消息处理失败:', error)
        }
      }
    })

    ROP.On('losed', () => {
      console.error('连接已断开')
      connectionStatus.value = 'disconnected'
      scheduleRetry()
    })
  }

  // ROP准备就绪处理
  const ROPReady = () => {
    setupEventHandlers()
    linkROP()

    // 监听页面可见性变化
    if (autoReconnectOnVisibility) {
      const visibility = useDocumentVisibility()
      visibilityWatcher = watch(visibility, (newVisibility) => {
        if (newVisibility === 'visible' && connectionStatus.value !== 'connected') {
          reconnect()
        }
      })
    }
  }

  // 清理资源
  const cleanup = () => {
    clearRetryTimer()
    if (visibilityWatcher) {
      visibilityWatcher()
      visibilityWatcher = null
    }
  }

  // 组件卸载时清理
  onBeforeUnmount(cleanup)

  // 加载或使用ROP客户端
  if (typeof window.ROP !== 'undefined') {
    ROPReady()
  } else {
    const ropScript = document.createElement('script')
    ropScript.src = scriptUrl
    ropScript.type = 'text/javascript'
    ropScript.onload = ROPReady
    ropScript.onerror = () => {
      console.error('ROP客户端脚本加载失败')
      connectionStatus.value = 'error'
    }
    document.head.appendChild(ropScript)
  }

  return {
    data: readonly(data),
    connectionStatus: readonly(connectionStatus),
    reconnect,
    cleanup,
  }
}
