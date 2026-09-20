# Electron 自定义配置

在项目启动初始化模块中调用一次；多窗口项目复用同一份声明。模板不会自动执行配置写入。

## 顶层获取，失败返回空值

允许配置失败后继续运行时，可以在顶层等待结果，失败返回 `null`，后续字段取值使用空字符串：

```ts
import { setupElectronConfig } from '@/utils/platform/electronConfig'

const config = await setupElectronConfig({
  list1: { name: '活动编号', default: '1001' },
  list2: { name: '接口地址', default: 'https://example.com' },
  list3: { name: '备注' },
}).catch(() => null)

const activityId = config?.list1 ?? ''
const apiUrl = config?.list2 ?? ''
```

在 Vue `<script setup>` 中使用顶层 `await` 会让组件成为异步组件，父级需要提供 `<Suspense>` 边界；接入前先检查实际渲染入口。失败返回 `null` 不会回滚客户端已经成功写入的默认值。

## 配置失败时停止初始化

业务必须依赖配置才能继续时，使用以下方式将错误交给启动错误处理：

```ts
import { setupElectronConfig } from '@/utils/platform/electronConfig'

try {
  const config = await setupElectronConfig({
    list1: { name: '活动编号', default: '1001' },
    list2: { name: '接口地址', default: 'https://example.com' },
    list3: { name: '备注' },
  })
  // 在此保存 config 到项目状态，再继续依赖配置的初始化。
  console.log(config.list1)
} catch (error) {
  console.error('Electron 配置初始化失败', error)
  throw error // 交给项目启动错误处理，不继续依赖配置的初始化。
}
```

- 仅支持 `list1`～`list20`，每项 `name` 和 `default` 均可省略，但提供时必须是字符串；数字请写成 `'1001'`。
- 返回二十个字段的实际字符串值，是本次读取结果，不会响应配置面板后续修改。需要重新读取时使用 `electronApi.getConfig()`。
- 普通浏览器返回声明的默认值，未声明默认值的字段返回 `''`。
- Electron 通过 `defineConfig()` 应用托管默认值：字段缺失、仍等于客户端初始值或上次托管默认值时更新；用户改为其他值后保留。主动清空且不同于托管默认值的字段也保留。
- 用户手动填写的值恰好等于托管默认值时，客户端无法区分，后续默认值升级仍会更新它。不要将此函数用于强制保存用户修改。
- 名称仅保存在客户端内存中，每次启动需要重新声明；未声明的字段不会被隐藏或修改名称。多窗口不要为同一字段声明不同名称或默认值。
- 所需接口缺失或调用失败会抛错，不回退为页面默认值。默认值处理成功后才设置名称；名称设置失败不会回滚已经应用的默认值，修复后可重试。
- 客户端严格读取保护需要使用包含该修复的客户端。它阻止配置文件或默认基线读取失败时继续写入，不提供外部程序并发修改或断电保护。
