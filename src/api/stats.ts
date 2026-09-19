import type { ResData } from '@/api/types'
import { useLockRequest } from '@/hooks/network/useLockRequest'
import type { AxiosRequestConfig } from 'axios'

export const statsProjectId = import.meta.env.VITE_APP_STATS_PROJECT_ID?.trim() || ''

export type TStatsRecord = {
  projectId: string
  projectName: string
  event: string
  date: string
}

export type TStatsResult = [null, ResData<TStatsRecord>] | [Error, null]

// 不同事件可连续发生，不能被共享请求锁丢弃；埋点失败不打断互动。
const { post: postStats } = useLockRequest(true, 0, { silent: true })

export const apiRecordStats = (event: string, config?: AxiosRequestConfig): Promise<TStatsResult> => {
  return new Promise((resolve) => {
    if (!/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/.test(statsProjectId)) {
      return resolve([new Error('未配置有效的统计项目 ID'), null])
    }
    if (!event.trim() || Array.from(event.trim()).length > 64) {
      return resolve([new Error('统计事件名称需为 1–64 个字符'), null])
    }
    if (navigator.onLine === false) return resolve([new Error('当前离线，仅保留本地统计'), null])

    const requestConfig: AxiosRequestConfig & { postEncrypt: boolean } = {
      timeout: 5000,
      ...config,
      postEncrypt: false,
    }
    postStats<ResData<TStatsRecord>>(
      'https://mm.event1.cn/stats/record',
      { projectId: statsProjectId, event: event.trim() },
      requestConfig,
    )
      .then((res) => resolve([null, res]))
      .catch((err: Error) => resolve([err, null]))
  })
}
