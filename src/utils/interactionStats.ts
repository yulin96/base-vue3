import { electronApi } from '@/config/env'

let initialization: Promise<InteractionStatInitResult> | undefined

export function initInteractionStats(): Promise<InteractionStatInitResult> {
  if (initialization) return initialization
  initialization = (async (): Promise<InteractionStatInitResult> => {
    const projectId = import.meta.env.VITE_APP_STATS_PROJECT_ID?.trim() || ''
    if (!/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/.test(projectId)) {
      return { initialized: false, error: '请配置有效的统计项目 ID' }
    }
    if (!electronApi?.initInteractionStats || !electronApi.recordInteractionStat) {
      return { initialized: false, error: '当前环境不支持统计，请使用支持统计的 Electron 客户端' }
    }
    try {
      return await electronApi.initInteractionStats({ projectId })
    } catch (error) {
      return { initialized: false, error: error instanceof Error ? error.message : '统计初始化失败' }
    }
  })()
  return initialization
}

/** 每次调用计数一次；业务负责同一轮事件防重。返回本地保存结果，不等待网络。 */
export async function recordInteractionStat(event: string): Promise<InteractionStatResult> {
  const projectId = import.meta.env.VITE_APP_STATS_PROJECT_ID?.trim() || ''
  if (!/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/.test(projectId)) {
    return { saved: false, error: '请配置有效的统计项目 ID' }
  }
  if (typeof event !== 'string' || !event.trim() || Array.from(event.trim()).length > 64) {
    return { saved: false, error: '统计事件名称需为 1–64 个字符' }
  }
  if (!electronApi?.recordInteractionStat) {
    return { saved: false, error: '当前环境不支持统计，请使用支持统计的 Electron 客户端' }
  }
  const initialized = await initInteractionStats()
  if (!initialized.initialized) return { saved: false, error: initialized.error }
  try {
    return await electronApi.recordInteractionStat({ projectId, event: event.trim() })
  } catch (error) {
    return { saved: false, error: error instanceof Error ? error.message : '统计发送失败' }
  }
}
