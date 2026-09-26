# AGENTS-PC.md

## 项目定位

- 这是一个 Vue 3 + Vite 的固定比例 PC 活动页或活动大屏项目，以真实 PC 设计稿宽高作为唯一画布基准。
- 本规范只适用于固定比例活动页、展陈页、互动大屏和固定比例横屏项目，不适用于后台管理系统、普通官网等需要响应式重排的桌面网站。
- 实际 PC 项目的根目录 `AGENTS.md` 应使用本文件内容。本文件是一份独立根规范，不依赖移动端 `AGENTS.md` 补充通用规则。
- 默认不做手机端兼容、移动端断点或响应式重排，除非用户明确要求。

## 沟通与执行

- 无论用户使用什么语言，所有回复与互动统一使用中文（简体）。
- 保持严谨、直接、工程化；优先定位根因，只做完成当前任务所必需的改动。
- 回答、解释、审查、诊断和方案设计只检查并汇报，不修改文件，除非用户明确要求修改或修复。
- 修改后运行与改动范围匹配的非破坏性检查；默认不执行 build，除非用户明确要求。
- 外部写入、破坏性操作或明显扩大改动范围前，先说明原因和推荐方案，等待用户确认。

## PC 模式基础状态

- PC 固定画布模式不能继续运行移动端适配链路。开始页面开发前，先确认以下目标状态已经成立：
  - `src/main.ts` 不再导入移动端 `src/plugins/setup/setRem.ts`，避免它按 `750` 设计宽度改写根字号、`#app` 尺寸和桌面二维码。
  - `vite.config.ts` 不再启用移动端 `pxtorem`，不要让 PC 数字类再次经过移动端换算。
  - `src/assets/styles/main.css` 不再导入移动端 `rem.m.css`。
  - `src/assets/styles/tailwind.css` 不再导入移动端固定像素映射 `size.css`。
  - `src/assets/styles/theme.css` 中的 `--spacing: 1px` 已停用，Tailwind 数字尺寸恢复为 `0.25rem` 基准。
  - `text-*`、`rounded-*`、`tracking-*` 等整数工具类统一按 `0.25rem` 换算。
  - `html` 中的 PC 根字号计算已经启用，并写入当前项目真实的设计稿宽高。
- 如果上述状态尚未成立，不要直接按 PC 设计稿堆页面。用户已明确要求将项目切换为 PC 固定画布时，必要的适配基础修改属于任务范围，说明涉及的文件和影响后直接执行，不重复询问。仅在切换意图、真实设计稿尺寸或授权边界无法从现有材料确认时，询问最小必要信息；等待时继续不依赖答案的工作。
- PC 模式不继承移动端 Vant `rootValue`。如果项目使用 Vant，按 PC 画布实际效果单独确认组件尺寸，不要为此重新启用全局移动端 `pxtorem`。

## PC 页面适配基准

- `--page-width` 和 `--page-height` 必须等于当前项目真实设计稿尺寸，不能直接沿用模板示例值。
- 根字号统一按以下关系计算：

```css
html {
  --page-width: 1920;
  --page-height: 1080;
  --page-width-size: calc(100vw / var(--page-width) * 4);
  --page-height-size: calc(100vh / var(--page-height) * 4);
  font-size: min(var(--page-width-size), var(--page-height-size));
}
```

- 上述 `1920 × 1080` 只用于展示计算方式，实际项目必须替换成真实设计稿尺寸。
- 页面按固定画布整体等比缩放；不要在业务组件内再叠加 `transform: scale()`、zoom 或第二套根字号逻辑。
- 当视口比例与设计稿不一致时，默认保持完整画布并居中留白；只有需求明确要求裁剪或铺满时才改变该策略。
- 默认兼容目标按项目当前构建配置执行，PC 浏览器基线为 Chrome 87 附近；如果运行在 Electron 或指定展陈设备中，以目标客户端的实际 Chromium、分辨率和缩放设置为准。

## 页面布局

- 页面外层视口负责居中，固定画布本身使用真实设计稿宽高，例如 `relative mx-auto h-1080 w-1920 overflow-hidden`；不要用 `h-full w-full` 代替设计稿画布尺寸。
- 背景层、装饰层、内容层和交互层要分清楚；不要把所有元素堆在同一个层级。
- 需要贴合设计稿的定位和尺寸优先使用设计稿数字，例如 `absolute left-120 top-80 h-200 w-400`。
- 百分比只用于表达明确的容器相对关系；表格、按钮、装饰和背景需要严格对位时，优先使用设计稿数字。
- 长列表只允许列表区域内部滚动，页面主体保持固定，不出现整页滚动。页面、弹层和列表不能同时争抢滚动。
- 表格、榜单、名单、视频、海报和二维码区域要给出稳定宽高，并按真实数据长度检查溢出、换行、空状态和极端内容。

## Tailwind 数字类

- PC 模式以设计稿数字为尺寸单位，Tailwind 默认数字尺寸按 `0.25rem` 换算：
  - `w-200` 表示 `calc(200 * 0.25rem)`；
  - `h-50` 表示 `calc(50 * 0.25rem)`；
  - `left-24`、`gap-12`、`p-20` 同理；
  - `text-16`、`rounded-20`、`tracking-2` 也按相同设计稿数字使用。
- 只有确认 PC 模式基础配置已经切换完成后，才能按上述换算理解数字类；移动端配置仍生效时，这个换算不成立。
- 固定尺寸优先使用数字类，例如 `w-320`，不要写 `w-[320px]`。
- 简短的颜色、网格列和 CSS 变量计算等可以使用 Tailwind 任意值；较长或多层的阴影、复杂或较长的背景声明、`@keyframes` 等使用普通 CSS，避免写成冗长的 Tailwind 任意值类。
- 非必要不写 `<style>`；但不要为了强行使用原子类而把复杂表达拆成难以维护的长类名。

## 编码原则

- 优先复用现有能力，不重复造轮子：
  - 页面路由放在 `src/pages`；
  - 通用组件优先放或查 `src/components`，并按用途分类；
  - hooks 优先放或查 `src/hooks`，并按用途分类；
  - 工具函数优先放或查 `src/utils`。
- 旧版能力统一放入 `legacy` 目录，新项目优先使用推荐版本。
- 自动组件名称包含目录名称，例如 `src/components/form/keyboard.vue` 对应 `FormKeyboard`。
- 不使用 `export *`，统一明确写出导出内容。
- 保持实现直接、清晰，不为了“通用性”提前创建复杂抽象。
- 除非明确要求，不添加大段注释、兼容性兜底代码或多套实现。
- 遇到动态配置、动态表单和后端下发字段时，把字段结构和表单值分开处理；不要为了类型看起来严格，把动态值强行塞进过窄类型。
- 普通文本表单的 `input`、`textarea` 默认使用 `v-model.trim`；业务明确需要保留首尾空格时除外。自定义组件使用修饰符前，确认组件正确处理 `modelModifiers`。
- 页面状态按业务含义分组，例如表单、列表、分页和弹窗状态；不要把大量零散 `ref` 直接堆在页面顶部。
- 弹窗、海报、视频、加载层等稳定显示关系使用明确状态驱动，不依赖中间动画步骤或临时回调判断最终显隐。

## 样式与交互

- 简单样式尽可能使用 Tailwind CSS 原子类，包括布局、间距、尺寸、字体、颜色、圆角和普通边框等，不为这些样式单独编写 CSS。
- 通用、可复用的自定义样式（如页面背景 `bg`、特殊边框效果等）统一放到 `src/assets/styles/global.css`，不分散在页面或组件的 `style` 中。
- 通用样式类统一使用 Tailwind CSS 的 `@utility` 定义，例如 `@utility bg1 { ... }`，不要写成普通的 `.bg1 { ... }`，以便 Tailwind 识别并支持变体；`global.css` 需接入现有 Tailwind 样式入口。
- 仅当前页面或组件使用的复杂样式可以放在其 `style` 中；需要复用时提取到 `global.css`，并使用 `@utility` 定义样式类。
- 背景图、视频和海报按 PC 设计稿比例处理。先固定容器尺寸，再根据素材和需求选择 `back-top`、`back-full`、`object-cover` 或 `object-contain`，不要默认所有背景都使用同一种铺法。
- `input` 本身不直接添加背景、边框等视觉样式；需要视觉效果时放在外层容器上。
- 交互控件优先使用语义正确的元素并添加项目要求的 `btn` 属性；如果当前项目明确要求用 `div` 实现按钮，则沿用该约定并补齐可点击、禁用和键盘交互状态。
- hover 只能作为增强效果，不能成为理解或完成核心操作的唯一方式；目标设备支持触摸时还要检查触摸反馈。
- 视频、海报、弹层切换使用稳定状态控制显示关系，避免切换过程中露出底层内容或出现白屏闪烁。

## 大屏互动统计

- 统计由配套 Electron 客户端负责，基础库只发送事件，不提供 P 键面板、localStorage 统计或直接线上上报。
- `.env` 的 `VITE_APP_STATS_PROJECT_ID` 必须配置真实项目短 ID，通过 `POST https://mm.event1.cn/stats/project` 提交项目名称获取；模板不填测试 ID。`src/plugins/appInit.ts` 在 Electron 中配置 ID 后自动调用薄封装 `initInteractionStats()`，每次页面启动声明项目，不计数、不上报。返回 `Promise<{ initialized: boolean; error: string | null }>`；失败明确记录，普通浏览器不自动初始化。
- 业务统一调用 `recordInteractionStat(event)`（`src/utils/interactionStats.ts`）；每次调用等待同一初始化 Promise 完成后携带 projectId，返回 `Promise<{ saved: boolean; error: string | null }>`，只表示本地保存结果，不等待网络完成。处理失败结果，但不要阻塞游玩或自动重试。
- 每次调用计数一次，事件使用统一中文名称；业务负责真实行为节点及同一轮防重。没有用户去重时按人次统计，打印预览不能当作打印成功。多窗口可并发计数，但同一行为不可重复发送。
- Electron 本地仅按 projectId 隔离，与资源地址和 `VITE_APP_LOCALSTORAGE_NAME` 无关；同 ID 共用统计。按北京时间分日，保留今日、累计及日期倒序明细。
- F8 打开或隐藏当前业务页面初始化项目的本机统计。重启、刷新或完整页面导航后重新初始化即可查看历史，不需要新事件；页面内路由切换保留关联。未初始化或当前没有统计数据时，F8 不弹窗；读取失败仍显示错误，不提供项目选择。
- “清除全部”只归档并清空当前项目本地统计，归档失败保留原数据，不调用云端删除接口。
- Electron 联网时独立尝试上报一次，离线、超时及失败不回滚本地、不重试、不补传。云端多设备合并，数量不保证与本机一致。
- 普通浏览器、缺少接口的旧客户端及无效 projectId 返回明确失败，不降级到浏览器存储或直接请求。旧 H5 localStorage 数据不迁移也不删除。
- 直接使用客户端接口时，先调用 `electronApi.initInteractionStats({ projectId })`，再发送同 ID 事件；未初始化或 ID 不匹配会失败。接口类型变动同步 `types/electron.d.ts`；详细接入方式见 `src/api/README.md`。

## 请求与业务代码

- 新增或修改业务接口及其页面、组件、hook 调用时，必须先阅读并遵守 [接口编写与调用规范](src/api/README.md)。默认沿用 `apiXxx`、每接口独立模块级请求锁、`[err, res]` 返回值，以及调用方先判请求错误再判业务码的写法。
- 请求统一走 `src/utils/request.ts`。
- 防重复提交优先使用 `src/hooks/network/useLockRequest.ts`。
- 新增接口优先放到 `src/api`，并补充对应类型。
- `useLockRequest` 的共享提示使用“正在处理中”，不要再把它作为“失败提示不准确”的待处理问题反复提出。
- `src/api` 只负责接口路径、参数和返回类型；鉴权、签名、FormData 转换和错误上报等底层逻辑继续放在 `src/utils/request.ts`。
- 业务成功或失败后的跳转、弹窗和 toast 由调用页面处理，不要全部塞进 API 层。
- 排查重复提交、分页切换和搜索竞态时，先检查锁、loading、取消请求和最后一次请求覆盖关系，不要只修改按钮禁用状态。
- 不为没有证据存在的场景添加复杂兼容或兜底逻辑。

## 启动、状态与缓存

- 启动初始化逻辑优先收口到 `src/plugins`、`src/utils` 或明确的初始化模块，`main.ts` 尽量只保留创建应用、注册插件、初始化和挂载。
- 初始化失败不能静默吞掉后继续进入半初始化页面；如果为了兼容保留旧行为，汇报时明确说明。
- 本地缓存 key 必须区分真实活动、项目或入口；不要让缺失的 `id`、`appid`、`projectId` 落入同一个共享缓存 key。
- 更新持久化状态时，先判断是替换成新状态还是合并补字段；旧字段可能残留时，优先从默认对象重建后再写入。
- 检查 `Object.assign`、展开合并和 `afterHydrate` 迁移逻辑中的旧数据残留及跨活动串数据风险。

## 平台能力

- 微信、钉钉、扫码、分享、预览图片等平台能力只有在需求明确时才接入，不为了通用增加当前项目用不到的平台分支。
- 平台能力的锁状态必须在失败、取消和权限拒绝等分支释放，避免用户后续无法再次触发。
- 摄像头、打印机、扫码器、展陈触摸屏、浏览器缩放和系统显示缩放等硬件或环境能力，普通桌面浏览器预览不能代替目标设备验证。

## Electron 客户端能力

- 项目运行在配套 `base-electron` 客户端时，统一从 `src/config/env.ts` 导入 `electronApi`；不要在业务代码里自行封装 IPC，也不要直接假定 `window.api` 一定存在。
- `electronApi` 在普通浏览器中可能是 `undefined`，且类型声明允许客户端只提供部分接口。调用时使用可选链，并对有业务影响的 Promise 失败进行明确处理。
- 客户端接口类型位于 `types/electron.d.ts`。客户端升级或新增 preload 接口后，先对照 `base-electron/src/preload/index.ts` 和 `base-electron/src/shared/app-types.d.ts` 同步类型，再在业务代码中使用。
- `list1`～`list20` 的名称、类型和默认值优先使用 `src/utils/platform/electronConfig.ts` 的 `setupElectronConfig` 集中声明并读取应用默认值后的实际配置，使用方式见 [Electron 配置说明](src/utils/platform/electronConfig.md)。在项目初始化入口调用，多窗口复用同一份声明；返回值不会自动同步配置面板后续修改。
- 业务明确允许配置失败后继续时，可使用 `await setupElectronConfig(...).catch(() => null)`，字段通过 `config?.list1 ?? ''` 读取；Vue `<script setup>` 顶层 `await` 必须先确认父级有 `<Suspense>` 边界。
- H5 仅通过 `defineProjectFields` 声明 list1～list20，不恢复 `defineConfig` 或任意配置写入。支持 text、number、switch、select，所有实际值和 default 为字符串，开关固定 '1'/'0'；不填 type 默认文本，不填 default 不更新值。
- 来源显式记录 default/user；缺失字段跟随默认值，用户编辑（即使等于旧默认值）保留，F12 恢复默认保存后重新跟随。旧配置无来源记录时按用户值保留，包括空字符串。
- 类型变化保留不兼容用户值，新声明保存后通过 `{ config, errors }` 返回问题；`setupElectronConfig` 遇到 errors 会抛错，业务应等待 F12 修正后继续。字段声明不重启，使用返回配置初始化；多窗口复用同一份声明，冲突报错。
- 客户端按完整 `resourceUrl` 隔离 list1～list20 及其字段声明和来源，查询参数和 # 内容也参与识别。F12 保存成功后立即重启；更换地址的同次保存不应用旧 list 表单值。旧托管记录不再影响实际配置。
- 配置面板定制优先复用客户端现有接口：
  - `defineDisplayNames(names)` 可修改全部配置项（含 list1～list20）的显示名称；非空名称优先于字段声明中的名称，不修改类型、默认值和配置值；
  - `hideConfig(targets)` 可隐藏字段、`exitButton` 子字段或配置分组；`hideAllConfig()` 会关闭并禁用本次运行期间的整个配置面板；
  - `defineDisplayNames` 设置的显示名称和隐藏状态只保存在客户端主进程内存中，客户端重启后需由业务页面重新设置。`hideAllConfig()` 本次运行内没有恢复接口，调用前必须确认这是明确需求。
- `electronApi.config` 是 preload 加载时的启动快照，不会自动刷新；需要最新配置时调用 `getConfig()`。默认值写入后，多数启动配置不会自动热更新，立即切换全屏应使用 `enterFullscreen()` 或 `exitFullscreen()`。
- 打印使用 `previewPrint(request)` 或 `print(request)`；打印预览不能代替目标打印机、实际纸张、驱动方向和静默打印的实机验证。
- 多窗口通信使用 `getScreenIndex()`、`sendToScreen()` 和 `onScreenMessage()`。组件卸载时必须调用监听函数返回的取消函数；`sendToScreen()` 返回 `true` 只表示消息已投递，不代表目标业务处理成功。
- `quit()`、`restart()` 属于高影响操作，客户端不会代替业务检查未保存内容或显示确认框，调用前由页面完成保存和用户确认。

## 验证方式

- 修改代码后优先运行与改动范围匹配的检查；能只检查单文件或少量文件时，不直接运行全量流程。
- 页面和样式修改默认进行静态检查。只有用户明确授权浏览器验证后，才按真实设计稿宽高及与改动相关的必要视口预览，检查画布居中、留白、溢出和内部滚动，不默认遍历所有视口。
- 修改适配基础配置后，检查 `src/main.ts`、`vite.config.ts`、`src/assets/styles/main.css`、`src/assets/styles/tailwind.css` 和 `src/assets/styles/theme.css`，确认移动端适配没有残留。
- 未获浏览器验证授权时，完成其余允许工作并报告视觉验证缺口，不为满足验证流程反复索取例外。不能仅凭静态检查声称视觉还原已验证，也不能把普通浏览器验证当成 Electron、打印机或展陈设备的实机证明。
- 默认不执行 build、浏览器操作、E2E 或视觉回归，用户明确要求的验证除外。技能不改变这些权限。无法完成目标设备验证时，明确说明未验证项、风险和用户需要执行的检查。

## 构建与发布

- 修改完成后，如果不是纯文档或说明，且有终端权限，直接运行合适的 lint、类型检查或针对性测试；否则提示用户执行 `pnpm check`。
- 普通构建优先使用 `pnpm build`，正式上传优先使用 `pnpm build:deploy`，测试上传优先使用 `pnpm build:deploy:test`。
- 只有明确需要跳过检查时，才使用 `pnpm build:only`、`pnpm deploy:prod` 或 `pnpm deploy:test`。
- 执行任何 build 或 deploy 前，先检查当前 `package.json` 脚本和 `vite.config.ts`，确认是否会上传、部署或并行执行。
- 当前脚本使用 `run-s` 保证顺序执行；如果后续改用 `run-p`，不能再把它当成“先检查通过再构建或上传”的顺序保障。
- ESLint 版本和配置可能变化，复用旧命令前以当前 `package.json` 和 `eslint.config.ts` 为准，不使用已经不兼容的旧参数。

## 多语言

- 多语言默认关闭。
- 需要开启时，取消 `src/main.ts` 中导入和启用 `i18n` 的两行注释。
- 页面切换语言统一使用 `src/locales` 导出的 `setLocale`。

## 给 Agent 的一句话

- 把这个项目当成“真实设计稿宽高、固定画布、整体等比缩放”的 PC 活动页工程来写。
- 不要重新引入移动端 `750`、`setRem`、`pxtorem`、`rem.m.css` 或 `size.css` 适配链路。
