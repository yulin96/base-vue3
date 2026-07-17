# Base Vue3（移动端项目基础库）

一个面向 H5 活动页/轻应用的 Vue 3 + Vite 基础工程。
项目内置移动端适配、文件路由、组件自动注册、常用业务组件与工具函数，可用于快速启动新项目。

## 项目分析（当前仓库）

- 技术栈：Vue 3 + Vite 8 + TypeScript + Pinia + Vue Router（文件路由）+ Vant + Tailwind CSS v4。
- 工程能力：ESLint + Prettier、GitHub Actions（type-check / lint / build:only）、自动生成路由与组件类型声明。
- 运行特征：默认 Hash 路由、移动端 rem 适配、支持 PC 预览模式（可生成扫码二维码）。
- 平台集成：内置微信分享/JSSDK、钉钉能力封装、可选 ARMS 前端监控。
- 构建与发布：图片优化、分包、产物整理；可按环境变量开关上传 OSS/FTP。

## 核心特性

- **移动端优先**：`postcss-pxtorem` + `setRem`，并对 Vant 使用独立 rootValue，同时支持 PC 模式包裹预览与二维码生成。
- **自动化开发体验**：
  - `src/pages/**/*.vue` 自动生成路由（`vue-router/auto-routes`）
  - `src/components/**` 组件自动注册（`unplugin-vue-components`）
  - Vant 组件自动解析导入（`@vant/auto-import-resolver`）
- **开箱业务能力**：
  - 防重复点击（带 `btn` 属性元素自动节流）
  - 常用 hooks（加载、计时、滑动、请求锁、二维码等）
  - 常用工具（动画、加密、DOM、文件处理、平台能力）
- **构建增强**：
  - Legacy 兼容构建（Chrome >= 87 / Safari >= 13）
  - 图片压缩、资源整理、自动注入分享 Meta、Rollup 可视化分析
  - 支持发布后自动上传 OSS / FTP（可选）

## 快速开始

### 1) 环境准备

- Node.js LTS（建议 20+）
- pnpm（建议 9+）

### 2) 安装依赖

```bash
pnpm install
```

### 3) 启动开发

```bash
pnpm dev
```

默认地址：`http://localhost:3020`（监听 `0.0.0.0`，可局域网访问）

## 常用命令

| 命令                     | 说明                                  |
| ------------------------ | ------------------------------------- |
| `pnpm dev`               | 启动开发服务器                        |
| `pnpm check`             | 依次执行类型检查和代码检查            |
| `pnpm type-check`        | 运行 `vue-tsc --build`                |
| `pnpm lint`              | ESLint 纯检查                         |
| `pnpm lint:fix`          | ESLint 检查并自动修复                 |
| `pnpm format`            | 格式化整个工程                        |
| `pnpm build:only`        | 仅打包（Vite build）                  |
| `pnpm deploy:prod`       | 使用 `deploy` 模式打包                |
| `pnpm deploy:test`       | 使用 `deploy-test` 模式打包           |
| `pnpm build`             | 检查通过后再打包                      |
| `pnpm build:deploy`      | 检查通过后再以 `deploy` 模式打包      |
| `pnpm build:deploy:test` | 检查通过后再以 `deploy-test` 模式打包 |
| `pnpm preview`           | 预览构建产物                          |

## 环境变量

项目基于 `VITE_*` 变量运行，默认示例见根目录 `.env`。

| 变量名                       | 说明                                          |
| ---------------------------- | --------------------------------------------- |
| `VITE_APP_API_URL`           | 接口基础地址                                  |
| `VITE_APP_LOCALSTORAGE_NAME` | 本地缓存前缀                                  |
| `VITE_APP_MAIN_COLOR`        | 页面主背景色（CSS 变量 `--main-color`）       |
| `VITE_APP_TITLE`             | 页面标题                                      |
| `VITE_APP_ARMS`              | 是否启用 ARMS（`1` 开启）                     |
| `VITE_DROP_CONSOLE`          | 构建时是否移除 `console/debugger`（`1` 移除） |
| `VITE_APP_HM_BAIDU`          | 百度统计 ID                                   |
| `VITE_APP_SHARE_TITLE`       | 微信分享标题                                  |
| `VITE_APP_SHARE_DESC`        | 微信分享描述                                  |
| `VITE_APP_SHARE_LINK`        | 微信分享链接                                  |
| `VITE_APP_SHARE_IMGURL`      | 微信分享图片                                  |
| `VITE_APP_AUTHOR`            | 注入到 `index.html` 的作者信息                |
| `VITE_APP_CONTACT`           | 注入到 `index.html` 的联系信息                |
| `VITE_OSS_ROOT_DIR`          | OSS 上传目录（用于发布插件开关）              |
| `VITE_FTP_DIRNAME`           | FTP 上传目录（用于发布插件开关）              |

> 注意：OSS/FTP 的密钥与账号由 `process.env` 读取（如 `zAccessKeyId`、`zH5FtpHost` 等），请通过 CI 或本地安全环境注入，不要写入仓库。

## 项目结构

```text
base-vue3/
├─ public/
│  └─ clear.html              # 清理 localStorage 的辅助页面
├─ src/
│  ├─ api/                    # API 入口与类型
│  ├─ assets/styles/          # 全局样式、主题、过渡动画
│  ├─ components/             # 按用途分类的自动注册组件
│  ├─ config/                 # 环境与常量配置
│  ├─ hooks/                  # 按用途分类的组合式 hooks
│  ├─ locales/                # i18n 资源（当前默认未启用）
│  ├─ pages/                  # 页面目录（自动生成路由）
│  ├─ plugins/                # 应用初始化、指令、监控和 Vant 配置
│  ├─ router/                 # 路由、全局守卫和历史记录
│  ├─ stores/                 # Pinia 状态
│  ├─ utils/                  # 通用工具、平台能力和旧版实现
│  └─ main.ts                 # 应用入口
├─ types/                     # 应用、外部库、可选能力和路由类型
└─ vite.config.ts             # 构建、样式、发布配置
```

## 开发约定

### 路由约定

- 页面放在 `src/pages` 下即可自动生成路由，类型声明输出到 `types/route-map.d.ts`。
- 页面可在 SFC 中通过 `<route lang="json">` 定义 `meta`，用于转场等逻辑。
- 项目默认通过 `meta.index` 自动推断页面切换动画方向。

### 组件与样式

- `src/components` 下组件会自动注册，并按用途生成名称。例如 `src/components/form/keyboard.vue` 对应 `FormKeyboard`。
- 全局样式入口：`src/assets/styles/main.css`。
- Tailwind 入口在 `src/assets/styles/tailwind.css`，主题变量与自定义 utility 主要在 `src/assets/styles/theme.css`。
- `src/assets/styles/rem.m.css` 是移动端页面容器样式，可在 `main.css` 中单独注释停用。

### 请求与状态

- 请求工具：`src/utils/request.ts`（Axios 实例 + 响应附加请求元数据）。
- 防重复请求：`src/hooks/network/useLockRequest.ts`。
- 用户状态：`src/stores/user.ts` 中的 `useStore`（已启用持久化）。

### 多语言

多语言资源保留在 `src/locales`，默认不启用。需要开启时，仅取消 `src/main.ts` 中以下两行注释：

```ts
// import i18n from '@/locales'
// app.use(i18n)
```

### 旧版能力

- 推荐优先使用 `MediaImageScale` 和 `useCanvasFrameAnimation`。
- 旧版拖动缩放和旧版逐帧动画保留在 `legacy` 目录，便于兼容旧项目。

### 调试建议

- URL 带 `?dev` 时会动态加载 vConsole，方便真机调试。
- 可访问 `/clear.html` 快速清理本地缓存。

## Electron 客户端接口

项目可作为配套 `base-electron` 客户端的业务页面运行。客户端通过 preload 暴露 `window.api`，本项目在 `src/config/env.ts` 中将其导出为 `electronApi`，完整调用类型见 `types/electron.d.ts`。

普通浏览器中没有这些客户端能力，因此调用时应保留可选链：

```ts
import { electronApi } from '@/config/env'

await electronApi?.defineDisplayNames?.({
  list1: '门店编号',
  list2: '活动编号',
})
```

### 配置面板定制

`defineDisplayNames(names)` 用于覆盖配置面板中的字段名称，最常见的用途是赋予 `list1` 到 `list10` 明确的业务含义。它只修改面板文案，不会修改对应配置值。

```ts
await electronApi?.defineDisplayNames?.({
  list1: '门店编号',
  list2: '活动编号',
  printCountdown: '打印倒计时',
})

await electronApi?.hideConfig?.(['performance', 'exitButton.mark', 'list10'])
```

- `hideConfig(targets)`：隐藏一个或多个配置字段、`exitButton` 子字段或配置分组。
- `hideAllConfig()`：关闭并禁用本次运行期间的整个配置面板；本次运行内没有恢复接口。
- `getConfigDisplayNames()`：读取当前已定义的字段名称。
- `getConfigEditorOptions()`：读取当前隐藏项和配置面板是否已整体禁用。

这些面板定制只保存在客户端主进程内存中，客户端重启后需要由业务页面重新调用。适合放在应用初始化流程中，不要依赖上一次运行的状态。

### 常用接口速查

| 接口                                     | 说明                            | 使用注意                                |
| ---------------------------------------- | ------------------------------- | --------------------------------------- |
| `config`                                 | preload 加载时读取的配置快照    | 配置文件变化后不会自动更新              |
| `getConfig()`                            | 重新读取并返回最新的标准化配置  | 需要最新值时优先使用                    |
| `defineConfig(patch)`                    | 局部合并并保存支持的配置字段    | 多数启动配置需重启客户端后生效          |
| `enterFullscreen()` / `exitFullscreen()` | 立即切换当前业务窗口全屏状态    | 返回值表示是否找到并处理了当前窗口      |
| `previewPrint(request)`                  | 按打印参数打开预览              | 不能验证打印机驱动默认纸型和实际装纸    |
| `print(request)`                         | 执行打印并返回 `PrintResult`    | 上线前需使用目标打印机和实际纸张验证    |
| `getScreenIndex()`                       | 获取当前业务窗口从 1 开始的编号 | 无法识别当前窗口时返回 `null`           |
| `sendToScreen(target, command, data?)`   | 向指定业务窗口发送消息          | `true` 只表示已投递，不表示业务处理成功 |
| `onScreenMessage(listener)`              | 监听其他窗口发来的消息          | 返回取消函数，组件卸载时必须调用        |
| `restart()` / `quit()`                   | 重启或退出客户端                | 调用前自行处理未保存数据并向用户确认    |

多窗口监听示例：

```ts
const stopListening = electronApi?.onScreenMessage?.((message) => {
  console.log(message.from, message.command, message.data)
})

await electronApi?.sendToScreen?.(2, 'player:play', {
  mediaId: 'demo-001',
})

// Vue 组件卸载时调用
stopListening?.()
```

客户端新增或调整接口后，应以其 `src/preload/index.ts` 和 `src/shared/app-types.d.ts` 为准，同步更新本项目的 `types/electron.d.ts`，不要只根据接口名称猜测行为。

## CI 与质量保障

GitHub Actions 在 `main` 分支 push / PR 时自动执行：

1. `pnpm type-check`
2. `pnpm lint`
3. `pnpm build:only`

此外，`main` 分支 push 后还会触发仓库镜像同步到 Gitea。

配置文件：

- `.github/workflows/type-check.yml`
- `.github/workflows/sync-to-gitea.yml`
