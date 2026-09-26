# 接口编写与调用规范

本文是本项目新增、修改业务接口时的默认约定，适用于 `src/api` 及其页面、组件、hook 调用方。以当前 `apiInit`、`apiTest` 和 `src/pages/index.vue` 的写法为基准；不要未经要求改成另一套请求架构。

## 分层与命名

- 业务接口放在 `src/api/index.ts`；接口增多且确有拆分需要时按业务拆文件，使用具名导出，不使用 `export *`。
- 接口函数命名为 `apiXxx`，响应业务数据类型命名为 `TXxx`，通常紧邻对应接口声明并导出。
- 统一复用 `src/api/types.ts` 的 `ResData<T>`：`code`、可选的 `msg` / `message`、`data`。`T` 表示 `data`，不是整个响应；额外顶层字段可以使用第二个泛型参数。
- 调用链为：页面 → `apiXxx` → `useLockRequest` → `axiosGet` / `axiosPost`。普通业务页面不直接使用 Axios、fetch 或另建请求实例。
- 请求地址、方法、字段和成功码以真实接口协议为准，不凭接口名称猜测。通常使用相对路径，由请求层提供基础地址；明确的外部接口才使用绝对地址。

## 接口模板

每个接口在模块顶层创建独立的 `useLockRequest()`，将方法重命名为 `postXxx` / `getXxx`。不要放进接口函数内，否则每次调用都会新建锁；不要让无关接口共用一把锁。

下面是写法模板，路径和字段仅用于示例，实际开发必须替换成已确认的协议。

```ts
import type { ResData } from '@/api/types'
import { useLockRequest } from '@/hooks/network/useLockRequest'
import type { AxiosRequestConfig } from 'axios'

const { post: postExample } = useLockRequest()

export type TExample = {
  id: number
}

export const apiExample = (data?: Record<string, any>, config?: AxiosRequestConfig<any>) => {
  return new Promise<[null, ResData<TExample>] | [Error, null]>((resolve) => {
    postExample<ResData<TExample>>('/example', data, config)
      .then((res) => {
        resolve([null, res])
      })
      .catch((err: Error) => {
        resolve([err, null])
      })
  })
}
```

- 默认保持以上 `new Promise` + `.then` / `.catch` 写法：成功 resolve `[null, res]`，请求失败 resolve `[err, null]`。不要直接返回裸响应、只返回 `res.data`、改成对象结果或在 catch 中 reject。
- GET 使用同样结构，把 `postExample` 换成 `getExample`，参数名使用 `params`，调用 `getExample<ResData<TExample>>(path, params, config)`。
- POST 参数名使用 `data`，第三个参数透传 `config`，便于调用方传入 `signal`、请求头或超时设置。不要丢弃配置或把配置混入业务数据。
- 当前通用参数沿用 `Record<string, any>`；有明确固定字段时可以声明对应参数类型，必填参数不能写成可选。动态表单不要强塞进过窄类型。
- 数据类型按实际响应填写，保留后端字段名和实际的空值、可选性。现有 `TTest = {}` 是占位，不能当作已明确接口的正式类型。
- 这里的 `Error` 是现有类型标注，不会转换运行时错误。锁冲突实际抛出普通对象 `{ code: -9996, error: ... }`，因此不要假定所有 `err` 都有 `message` 或满足 `instanceof Error`；需要读取错误字段时先收窄类型。

## 页面调用模板

```ts
import { apiExample } from '@/api'
import { toast } from 'vue-sonner'

const [err, res] = await apiExample({ id: 1 })
if (err) return
if (res.code != 200) return toast.warning(res?.message || res?.msg || '正在处理中...')

// 此处使用 res.data 更新当前页面的业务状态。
```

- 顺序固定为：先检查 `err`，再检查业务码，最后读取业务数据。当前页面以 `200` 为成功码；其他接口只有协议明确不同才调整。
- `res` 已是服务端响应体，不是 AxiosResponse：业务码读 `res.code`，业务数据读 `res.data`，不要多套一层 `.data`。
- 业务码失败仍属于请求成功返回，由页面判断；API 层不要擅自把非 `200` 改成请求异常。
- 普通调用不再重复套一层仅用于捕获接口请求错误的 try/catch。请求锁内部已对非取消的请求异常显示“正在处理中...”，调用方默认 `if (err) return`，避免重复 toast。锁冲突在请求前抛出，不经过这个共享 toast。
- 页面自行负责成功后的提示、跳转、弹窗和状态更新，API 层只包装请求结果。有页面 loading 时应确保所有退出分支都恢复，可用 try/finally；请求锁不是完整的页面 loading 管理。

## 请求锁与底层行为

- 默认 `useLockRequest(false, 500)`：请求期间上锁，完成后延迟 500ms 解锁；同一接口的锁在模块调用方之间共享，并非每个页面独立。
- 不为了让重复点击通过而随意设置 `disableLock = true`。搜索、分页等需要并发或取消时，按业务处理取消和结果覆盖关系，锁不能替代竞态处理。
- JSON 是 POST 默认格式；协议明确需要 FormData 时，使用 `postXxx<ResData<TXxx>>(path, data, config, 'FormData')`，由请求层转换，不在页面复制转换逻辑。
- POST 签名、加密与载荷转换由 `src/utils/request.ts` 及其 `request-payload.ts`、`request-signature.ts` 依赖处理，不在接口函数内重复实现，也不自行拼签名字段。
- 不顺手增加全局业务码拦截、重试、鉴权、错误上报或通用 API 工厂；需要新增底层能力时另按明确需求处理。

## 现有特殊用法

互动统计由 Electron 统一保存和上报，基础库不直接请求统计接口、不再维护本地统计面板。
`.env` 的 `VITE_APP_STATS_PROJECT_ID` 填写真实项目短 ID（由 `POST https://mm.event1.cn/stats/project` 创建项目获取）。`src/plugins/appInit.ts` 在 Electron 环境且配置 ID 后自动初始化项目，重启或刷新后也会重新声明；初始化不计数、不上报。

```ts
import { initInteractionStats, recordInteractionStat } from '@/utils/interactionStats'

// 默认 appInit 已自动调用；自定义启动入口需主动调用，重复调用复用同一 Promise。
const { initialized, error: initError } = await initInteractionStats()
// initialized 为 false 时处理 initError；初始化失败不自动重试。

// 在真实行为节点调用；每轮对应事件只发一次，自动等待初始化，不等待网络。
void recordInteractionStat('开始').then(({ saved, error }) => {
  if (!saved) {
    // 将 error 交给项目维护状态处理，不自动重试、不阻塞互动。
  }
})
```

直接使用客户端 API 时，先 `electronApi.initInteractionStats({ projectId })`，检查 `initialized`，再调用 `recordInteractionStat({ projectId, event })`。未初始化或项目 ID 不匹配时拒绝记录。

事件封装返回 `Promise<{ saved: boolean; error: string | null }>`，只表示 Electron 本地保存结果。
普通浏览器或旧客户端缺少接口、项目 ID 无效时明确返回失败，不启用浏览器兜底。
本地按 projectId 隔离并按北京时间分日；F8 查看已初始化的项目，重启或刷新后初始化完成即可查看历史，不需要产生新事件；完整页面导航重新初始化，页面内路由切换保留关联。未初始化或当前没有统计数据时 F8 不弹窗，读取失败仍显示错误。
“清除全部”归档并清空当前项目本地统计，不影响云端。旧 H5 数据不迁移、不删除。
Electron 有网时尝试上报一次，失败不重试、离线不补传；本机数量与云端数量可能不同。

`apiMenus` 使用 `[boolean, MenuData | null]`，`replaceToWithMenus` 包含菜单跳转及提示，`getOpenId` 返回布尔结果并更新用户状态。这些是已有特定业务封装，维护时保留其调用契约；新增普通业务接口默认使用上面的 `[err, res]` 模板，不照搬它们的返回形式或业务副作用。

## 完成前核对

- 方法、地址、参数和响应类型有协议依据；每个接口有独立模块级锁。
- 保留配置透传、完整响应和错误元组；调用方按请求错误 → 业务码 → 数据的顺序处理。
- 不重复提示、不在 API 层混入页面业务、不擅自改变现有接口契约。
- 按项目要求进行最小必要静态检查；未授权时不执行 build、浏览器或 E2E 验证。
