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

互动埋点是独立例外：`src/api/stats.ts` 使用 `useLockRequest(true, 0, { silent: true })`，允许真实事件连续并发且不显示请求失败 toast。
通过请求层的 `postEncrypt: false` 保持外部统计接口的普通 JSON 协议，其他业务请求的锁、提示和加密默认不变。
`.env` 的 `VITE_APP_STATS_PROJECT_ID` 配置统计项目短 ID；留空、无效或明确离线时不发送请求，不自动重试或补传历史。
API 仍返回 `[err, res]` 元组，业务失败通过 `res.code` 判断。

互动页面统一使用下面的双通道入口，不再单独调用 API 或重复增加本地计数：

```ts
import { recordInteractionStat, getLocalInteractionStats, archiveAndClearLocalInteractionStats } from '@/utils/interactionStats'

// 每轮开始时只调用一次；开始、完成、打印等事件由业务的真实完成节点触发。
const { localError, remote } = recordInteractionStat('开始')
// 此处立即继续互动，不需要 await remote。
// localError 非空时由统计面板提示本机保存失败；不要因此阻塞互动。
void remote.then(([err, res]) => {
  if (err) return
  if (res.code !== 200) return
  // 云端已接收；不再次增加本地计数。
})

const local = getLocalInteractionStats() // daily、totals、archives，供本地面板使用
// 只在用户点击“清除统计”时调用，并捕获存储失败，成功前不重置面板。
// const archive = archiveAndClearLocalInteractionStats()
```

本机统计使用 `VITE_APP_LOCALSTORAGE_NAME` 隔离，按北京时间分日；云端项目 ID 可后续配置，不改变本地存储 key。
本地归档清零不清空云端。离线记录不会自动补传，因为当前服务端不支持历史日期和幂等去重。
当前工具不包含页面统计面板或业务事件绑定，各互动项目应按实际流程接入；多窗口需指定唯一计数窗口。

`apiMenus` 使用 `[boolean, MenuData | null]`，`replaceToWithMenus` 包含菜单跳转及提示，`getOpenId` 返回布尔结果并更新用户状态。这些是已有特定业务封装，维护时保留其调用契约；新增普通业务接口默认使用上面的 `[err, res]` 模板，不照搬它们的返回形式或业务副作用。

## 完成前核对

- 方法、地址、参数和响应类型有协议依据；每个接口有独立模块级锁。
- 保留配置透传、完整响应和错误元组；调用方按请求错误 → 业务码 → 数据的顺序处理。
- 不重复提示、不在 API 层混入页面业务、不擅自改变现有接口契约。
- 按项目要求进行最小必要静态检查；未授权时不执行 build、浏览器或 E2E 验证。
