import type { AxiosRequestConfig } from 'axios'

import type { ResData } from '@/api/types'
import { services } from '@/config/services'
import { useLockRequest } from '@/hooks/network/useLockRequest'

type ApiResult<T> = [null, ResData<T>] | [Error, null]

export type TProjectSwitch = {
  id: number
  name: string
  enabled: boolean
  scheduleOn: string
  scheduleOff: string
  scheduleOnAt: string
  scheduleOffAt: string
  remark: string
  url: string
  sortOrder: number
  projectId: number | null
  version: number
  createdAt: string
  updatedAt: string
}

export type TStatRecordInput = { projectId: string; event: string; title?: string; remark?: string }
export type TStatRecord = {
  projectId: string
  projectName: string
  title: string
  event: string
  date: string
  hour: number
}
export type TProjectStats = {
  project: { id: string; name: string }
  timezone: 'Asia/Shanghai'
  startDate: string
  endDate: string
  events: {
    title: string
    name: string
    total: number
    periodTotal: number
    hourly: { date: string; hour: number; count: number }[]
  }[]
  daily: { date: string; counts: Record<string, number>; events: { title: string; name: string; count: number }[] }[]
}
export type TPublicProjects = { items: { projectId: string; name: string; url: string }[] }
export type TIpInfo = {
  ip: string
  version: 4 | 6
  isPrivate: boolean
  location: { country: string; region: string; city: string; district: string; isp: string; raw: string } | null
}

const { get: getProjectSwitch } = useLockRequest(true, 0)
const { get: getProjectSwitches } = useLockRequest(true, 0)
const { post: postStatRecord } = useLockRequest(true, 0, { silent: true })
const { get: getProjectStats } = useLockRequest(true, 0)
const { get: getPublicProjects } = useLockRequest()
const { get: getIpInfo } = useLockRequest(true, 0)

export function apiProjectSwitch(params: { name: string; projectId?: number }, config?: AxiosRequestConfig) {
  return new Promise<ApiResult<TProjectSwitch>>((resolve) => {
    getProjectSwitch<ResData<TProjectSwitch>>('/switches', params, { ...config, baseURL: services.mm.baseURL })
      .then((res) => resolve([null, res]))
      .catch((err: Error) => resolve([err, null]))
  })
}

export function apiProjectSwitches(params: { projectId?: number } = {}, config?: AxiosRequestConfig) {
  return new Promise<ApiResult<TProjectSwitch[]>>((resolve) => {
    getProjectSwitches<ResData<TProjectSwitch[]>>('/switches', params, { ...config, baseURL: services.mm.baseURL })
      .then((res) => resolve([null, res]))
      .catch((err: Error) => resolve([err, null]))
  })
}

export function apiRecordStat(data: TStatRecordInput, config?: AxiosRequestConfig) {
  const requestConfig = { ...config, baseURL: services.mm.baseURL, postEncrypt: false }
  return new Promise<ApiResult<TStatRecord>>((resolve) => {
    postStatRecord<ResData<TStatRecord>>('/stats/record', data, requestConfig)
      .then((res) => resolve([null, res]))
      .catch((err: Error) => resolve([err, null]))
  })
}

export function apiProjectStats(
  projectId: string,
  params: { startDate?: string; endDate?: string } = {},
  config?: AxiosRequestConfig,
) {
  return new Promise<ApiResult<TProjectStats>>((resolve) => {
    getProjectStats<ResData<TProjectStats>>(`/stats/${encodeURIComponent(projectId)}`, params, {
      ...config,
      baseURL: services.mm.baseURL,
    })
      .then((res) => resolve([null, res]))
      .catch((err: Error) => resolve([err, null]))
  })
}

export function apiPublicProjects(config?: AxiosRequestConfig) {
  return new Promise<ApiResult<TPublicProjects>>((resolve) => {
    getPublicProjects<ResData<TPublicProjects>>('/projects', undefined, { ...config, baseURL: services.mm.baseURL })
      .then((res) => resolve([null, res]))
      .catch((err: Error) => resolve([err, null]))
  })
}

export function apiIpInfo(params: { ip?: string } = {}, config?: AxiosRequestConfig) {
  return new Promise<ApiResult<TIpInfo>>((resolve) => {
    getIpInfo<ResData<TIpInfo>>('/ip', params, { ...config, baseURL: services.mm.baseURL })
      .then((res) => resolve([null, res]))
      .catch((err: Error) => resolve([err, null]))
  })
}
