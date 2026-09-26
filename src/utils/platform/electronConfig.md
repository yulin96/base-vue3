# Electron 自定义配置

`setupElectronConfig` 只声明 list 字段名称并读取客户端实际配置，不写入默认值。初始配置由 Electron 提供，现场参数在客户端 F12 设置窗口修改。

```ts
import { setupElectronConfig } from '@/utils/platform/electronConfig'

const config = await setupElectronConfig({
  list1: { name: '活动编号' },
  list2: { name: '接口地址' },
  list3: { name: '备注' },
})

const activityId = config.list1
const apiUrl = config.list2
```

- 仅支持 `list1`～`list20`，每项只接受可选字符串 `name`；旧 `default` 参数已移除，传入时明确报错。删除旧默认值声明，将需要保存的值改在客户端设置。
- 在项目启动入口调用；多窗口复用同一份名称声明。名称只保存在客户端内存中，每次启动重新声明，不改变配置值。
- 返回二十个字段的实际字符串值，不自动响应后续变化；需要最新配置时调用 `electronApi.getConfig()`。
- 普通浏览器返回二十个空字符串。业务允许时，可自行使用页面内部缺省值，不写回客户端；不要将配置读取失败伪装为读取成功。
- Electron 缺少 `getConfig`、需要声明名称但缺少 `defineDisplayNames`、读取或命名失败时抛错。业务必须依赖配置时，应停止相关初始化并处理错误。
- 业务明确允许失败后继续时，可使用 `await setupElectronConfig(...).catch(() => null)`。Vue `<script setup>` 顶层 `await` 需要父级 `<Suspense>` 边界。
- `defineConfig` 已移除；配置文件读写只供客户端设置窗口使用。F12 保存成功后立即重启，失败不重启；不同资源地址的项目参数继续隔离。
