import { useDocumentVisibility } from '@vueuse/core'
import { onBeforeUnmount, readonly, ref, shallowRef, watch } from 'vue'

type ROPEventCallback = (...args: any[]) => void

// ROP客户端类型定义
interface ROPClient {
  On: (event: string, callback: ROPEventCallback) => void
  Off?: (event: string, callback: ROPEventCallback) => void
  Enter: (pub: string, sub: string, suid: string, boolean: boolean) => void
  Subscribe: (topic: string) => void
  Publish: (topic: string, message: string) => void
}

// 为ROP全局对象定义类型
declare global {
  interface Window {
    ROP?: ROPClient
  }
}

const ROP_SCRIPT_MARKER = 'data-rop-client-script'
let ropScriptLoadingPromise: Promise<void> | null = null

function ensureRopScript(scriptUrl: string): Promise<void> {
  if (window.ROP) return Promise.resolve()

  if (!ropScriptLoadingPromise) {
    ropScriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[${ROP_SCRIPT_MARKER}="true"]`)
      if (existingScript) {
        if (window.ROP) return resolve()

        existingScript.addEventListener('load', () => resolve(), { once: true })
        existingScript.addEventListener('error', () => reject(new Error('ROP客户端脚本加载失败')), { once: true })
        return
      }

      const ropScript = document.createElement('script')
      ropScript.src = scriptUrl
      ropScript.type = 'text/javascript'
      ropScript.setAttribute(ROP_SCRIPT_MARKER, 'true')
      ropScript.onload = () => resolve()
      ropScript.onerror = () => reject(new Error('ROP客户端脚本加载失败'))
      document.head.appendChild(ropScript)
    }).catch((error) => {
      ropScriptLoadingPromise = null
      throw error
    })
  }

  return ropScriptLoadingPromise
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
  const eventHandlers: Array<{ event: string; callback: ROPEventCallback }> = []
  let handlersRegistered = false
  let destroyed = false

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

  const addEventHandler = (ROP: ROPClient, event: string, callback: ROPEventCallback) => {
    ROP.On(event, callback)
    eventHandlers.push({ event, callback })
  }

  const removeEventHandlers = () => {
    if (!window.ROP?.Off) {
      eventHandlers.length = 0
      return
    }

    eventHandlers.forEach(({ event, callback }) => {
      window.ROP?.Off?.(event, callback)
    })
    eventHandlers.length = 0
  }

  // 延迟重连
  const scheduleRetry = () => {
    if (destroyed) return

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
    if (destroyed) return

    if (!window.ROP) {
      console.error('ROP 客户端未就绪')
      scheduleRetry()
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
    if (destroyed) return
    retryCount.value = 0
    clearRetryTimer()
    linkROP()
  }

  // 事件处理函数注册
  const setupEventHandlers = () => {
    if (!window.ROP || handlersRegistered) return
    handlersRegistered = true
    const ROP = window.ROP

    addEventHandler(ROP, 'enter_suc', () => {
      console.log('连接成功')
      connectionStatus.value = 'connected'
      retryCount.value = 0
      clearRetryTimer()

      if (subIsString) {
        ROP.Subscribe(subScribes as string)
      } else {
        ;(subScribes as string[]).forEach((topic) => ROP.Subscribe(topic))
      }
    })

    addEventHandler(ROP, 'reconnect', () => {
      console.log('重连中')
      connectionStatus.value = 'reconnecting'
    })

    addEventHandler(ROP, 'offline', (err: string) => {
      console.error('离线状态:', err)
      connectionStatus.value = 'disconnected'
      scheduleRetry()
    })

    addEventHandler(ROP, 'enter_fail', (err: string) => {
      console.error('登录失败:', err)
      connectionStatus.value = 'error'
      scheduleRetry()
    })

    addEventHandler(ROP, 'publish_data', (message: any, topic: string) => {
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

    addEventHandler(ROP, 'losed', () => {
      console.error('连接已断开')
      connectionStatus.value = 'disconnected'
      scheduleRetry()
    })
  }

  // ROP准备就绪处理
  const ROPReady = () => {
    if (destroyed) return
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
    removeEventHandlers()
    handlersRegistered = false
  }

  const destroy = () => {
    destroyed = true
    cleanup()
  }

  // 组件卸载时清理
  onBeforeUnmount(destroy)

  void ensureRopScript(scriptUrl)
    .then(() => {
      ROPReady()
    })
    .catch((error) => {
      console.error('ROP客户端脚本加载失败', error)
      connectionStatus.value = 'error'
    })

  return {
    data: readonly(data),
    connectionStatus: readonly(connectionStatus),
    reconnect,
    cleanup,
  }
}
