# 项目开发说明

## 沟通与执行

- 向用户汇报时使用简单、直白、非技术化的语言。
- 默认不执行 build，除非用户明确要求。
- 优先寻找问题源头，只做当前目标需要的改动，不顺手重构无关代码。
- 这是 PC 固定比例项目，不要套用移动端 `750` 设计稿、`pxtorem`、`rem.m.css`、`size.css` 的默认规则。
- 如果发现项目还没切换为 PC 模式，优先运行或建议运行 `pnpm setup:pc`，按真实 PC 设计稿宽高完成基础配置后再开发页面。
- 页面按钮统一使用 `div`，并添加 `btn` 属性；不使用 `button`。
- `input` 本身不添加背景、边框等视觉样式，视觉效果放在外层容器。

## PC 页面适配基准

- 本项目是固定比例的 PC 活动大屏页面，不按普通后台管理系统做响应式重排。
- 页面以设计稿宽高为唯一基准，根字号由 `html` 里的 `--page-width`、`--page-height`、`--page-width-size`、`--page-height-size` 计算。
- `--page-width` 和 `--page-height` 必须等于当前项目真实设计稿尺寸，不要沿用模板默认值。
- 背景图按设计稿宽度铺满，优先使用 `back-top` 和 `bg-[url(...)]`。
- 主内容使用基准画布内的固定定位和固定尺寸，避免使用百分比导致表格、按钮和背景错位。
- 页面按固定画布整体等比缩放；不要在业务组件内自行增加额外缩放逻辑。
- 长列表只允许列表区域内部滚动，页面主体保持固定，不出现整页滚动。
- 默认不做手机端兼容、移动端断点或响应式重排，除非用户明确要求。

## 页面布局

- 页面根容器优先使用固定画布语义，例如 `relative mx-auto h-full w-full overflow-hidden`，具体按现有页面结构保持一致。
- 背景层、装饰层、内容层要分清楚；不要把所有元素都堆在一个层级里。
- 需要贴合设计稿的元素优先使用绝对定位和数字类，例如 `absolute left-120 top-80 w-400 h-200`。
- 表格、榜单、名单、滚动区域要给稳定宽高；只让内容区域滚，不让整页滚。
- 大屏页面常见内容变化包括名单、排名、状态、视频、海报、二维码；这些区域要预留真实数据长度，避免只按静态截图摆放。

## Tailwind 数字类

- 本项目以设计稿数字为尺寸单位，最终统一通过 `rem` 适配，尺寸优先使用数字类名：
  - `w-200` 表示 `calc(200 * 0.25rem)`
  - `h-50` 表示 `calc(50 * 0.25rem)`
  - `top-24`、`gap-12`、`p-20` 同理
  - `text-16` 表示 `calc(16 * 0.25rem)`
  - `rounded-20` 表示 `calc(20 * 0.25rem)`
- `text-*` 和 `rounded-*` 已支持直接传任意整数，优先使用数字类名，不为尺寸编写其他单位。
- 颜色、复杂背景、阴影、网格列等无法简洁表达时，可以使用 Tailwind 任意值。
- 非必要不写 `<style>`；优先使用 Tailwind 类。
- 固定尺寸不要写 `px`，优先写数字类；例如用 `w-320`，不要写 `w-[320px]`。
- 字号、圆角、字距也使用数字类；例如 `text-28`、`rounded-12`、`tracking-2`。

## 资源与媒体

- 背景图、视频、海报等资源要按 PC 设计稿比例处理，避免直接套移动端裁剪方式。
- 视频和图片区域要有明确尺寸和裁剪方式，优先让容器固定，再决定 `object-cover`、`object-contain` 或背景铺法。
- 如果页面有视频、海报、弹层切换，使用稳定状态控制显示关系，避免切换中露出底层内容或闪烁。

## 验证方式

- 默认不执行 build。
- 修改样式或页面后，优先运行与改动范围匹配的 lint / type-check；能只查单文件就不要跑全量流程。
- 如果改了适配基础配置，至少检查 `vite.config.ts`、`src/assets/styles/main.css`、`src/assets/styles/tailwind.css`、`src/assets/styles/theme.css` 是否仍符合 PC 模式。
- 涉及视觉还原时，优先用浏览器按目标宽高预览；不要只看代码判断位置是否正确。

## Electron 客户端能力

- 项目运行在配套 `base-electron` 客户端时，统一从 `src/config/env.ts` 导入 `electronApi`；不要在业务代码里自行封装 IPC，也不要直接假定 `window.api` 一定存在。
- `electronApi` 在普通浏览器中可能是 `undefined`，且类型声明允许客户端只提供部分接口。调用时使用可选链，并对有业务影响的 Promise 失败进行明确处理。
- 客户端接口的本项目类型声明位于 `types/electron.d.ts`。客户端升级或新增 preload 接口后，先对照 `base-electron/src/preload/index.ts` 和 `base-electron/src/shared/app-types.d.ts` 同步类型，再在业务代码中使用。
- 配置面板定制优先复用客户端现有接口：
  - `defineDisplayNames(names)` 修改配置字段在面板中的显示名称，常用于为 `list1` 到 `list10` 设置业务名称；它不修改配置值。
  - `hideConfig(targets)` 可隐藏字段、`exitButton` 子字段或配置分组；`hideAllConfig()` 会关闭并禁用本次运行期间的整个配置面板。
  - 上述显示名称和隐藏状态只保存在客户端主进程内存中，客户端重启后需由业务页面重新设置。`hideAllConfig()` 本次运行内没有恢复接口，调用前必须确认这是明确需求。
- `electronApi.config` 是 preload 加载时的启动快照，不会自动刷新；需要最新配置时调用 `getConfig()`。`defineConfig(patch)` 会局部写入配置，但多数启动配置不会自动热更新，立即切换全屏应使用 `enterFullscreen()` / `exitFullscreen()`。
- 打印使用 `previewPrint(request)` / `print(request)`；打印预览不能替代目标打印机、实际纸张、驱动方向和静默打印的实机验证。
- 多窗口通信使用 `getScreenIndex()`、`sendToScreen()` 和 `onScreenMessage()`。组件卸载时必须调用监听函数返回的取消函数；`sendToScreen()` 返回 `true` 只表示消息已投递，不代表目标业务处理成功。
- `quit()`、`restart()` 属于高影响操作，客户端不会代替业务检查未保存内容或显示确认框，调用前由页面完成保存和用户确认。
