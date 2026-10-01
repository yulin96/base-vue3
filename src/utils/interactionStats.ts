import { electronApi } from '@/config/env'

/** 每次调用计数一次；业务负责同一轮事件防重。返回本地保存结果，不等待网络。 */
export async function recordInteractionStat(event: string, title?: string): Promise<InteractionStatResult> {
  if (typeof event !== 'string' || !event.trim() || Array.from(event.trim()).length > 64) {
    return { saved: false, error: '统计事件名称需为 1–64 个字符' }
  }
  if (!electronApi?.recordInteractionStat) {
    return { saved: false, error: '当前环境不支持统计，请使用支持统计的 Electron 客户端' }
  }
  if (title !== undefined && (typeof title !== 'string' || !title.trim() || Array.from(title.trim()).length > 64)) {
    return { saved: false, error: '统计分组名称需为 1–64 个字符' }
  }
  try {
    return await electronApi.recordInteractionStat({
      event: event.trim(),
      ...(title === undefined ? {} : { title: title.trim() }),
    })
  } catch (error) {
    return { saved: false, error: error instanceof Error ? error.message : '统计发送失败' }
  }
}
