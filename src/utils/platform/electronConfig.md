# Electron 业务字段

在页面启动时用 `setupElectronConfig` 统一声明 list1～list20 的名称、类型、默认值与选项。它调用 `electronApi.defineProjectFields`，返回应用默认值后的实际配置，也可单独调用 `defineDisplayNames` 覆盖显示名称。

```ts
import { setupElectronConfig } from '@/utils/platform/electronConfig'

const config = await setupElectronConfig({
  list1: { name: '等待时间', type: 'number', default: '10' },
  list2: { name: '灯光', type: 'switch', default: '0' },
  list3: { name: '运行模式', type: 'select', options: ['自动', '手动'], default: '自动' },
  list4: { name: '备注' },
})

const seconds = Number(config.list1)
const lightEnabled = config.list2 === '1'
```

- 支持 text、number、switch、select，省略 type 时为文本。所有实际值及 default 都是字符串；数字用 `'10'`，开关用 `'1'` / `'0'`。下拉 options 为非空、不重复的字符串数组，默认值必须是其中一项。
- 每个传入字段替换其完整声明，未传入字段保留。未提供 default 时不初始化或更新该字段的值。多窗口使用同一份声明，重叠字段冲突时明确拒绝，不采用后调用覆盖。
- Electron 显式记录字段来源。缺失字段或仍跟随默认的字段会随默认值升级，例如 `'10'` 改为 `'20'`；用户手动设置即使等于旧默认值也保留。
- F12 仅将实际编辑的字段标为用户设置；点击“恢复默认”并保存后重新跟随默认值。旧配置没有来源记录时保留原值，包括空字符串；需要跟随后续默认值时在 F12 恢复默认。
- 名称、类型、默认值、来源及实际值均按资源地址隔离。类型变化时保留不兼容用户值，在 F12 提示修正或恢复默认，不能静默转换。
- 客户端接口返回 `Promise<{ config: AppConfig; errors: Partial<Record<ProjectFieldKey, string>> }>`。errors 非空时说明新声明已保存、旧值仍待修正；本封装明确抛错，业务应暂停依赖这些字段的初始化。直接调用接口时同样需要检查 errors。
- 声明不触发重启，业务使用返回值初始化，不使用 `electronApi.config` 的旧快照；F12 手动保存成功后仍重启。设置页打开期间若声明或值发生变化，保存会要求重新读取。
- 普通浏览器使用声明默认值预览，未声明默认值返回空字符串，不持久化。Electron 缺少新接口时明确报错，不回退到旧配置写入接口。
- `defineDisplayNames` 继续支持全部字段（含 list1～list20）；非空名称优先于字段声明中的名称，仅本次运行有效，不改变类型、默认值、来源或已保存值。隐藏字段功能保持不变。`defineConfig` 不恢复，资源地址及设备配置仍只能在 F12 修改。
- Vue `<script setup>` 顶层 `await` 需要父级 `<Suspense>`。仅在业务明确允许配置失败后继续时使用 `.catch(() => null)`，不要把失败伪装成默认值已保存。
