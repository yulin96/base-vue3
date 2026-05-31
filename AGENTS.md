# AGENTS.md

## 项目定位

- 这是一个移动端优先的 Vue 3 + Vite H5 项目，主要面向活动页、轻应用、营销页。
- 默认只需要做好手机端体验，不需要单独设计一套桌面端页面。
- 桌面端预览由 `src/plugins/setup/setRem.ts` 自动处理：会把 `#app` 按移动端比例缩放、居中展示，并在足够宽时生成二维码。

## 适配规则

- 默认按 `750` 宽设计稿开发。
- 根字号由 `setRem` 根据视口宽度自动换算，业务样式按移动端稿子思考即可。
- `postcss-pxtorem` 会自动把业务代码里的 `px` 转成 `rem`。
- Vant 使用单独的 `rootValue`，不要手动覆盖 Vant 的适配逻辑。
- 除非明确要求，不要额外写一套 PC 布局、响应式断点或桌面端分支。

## 布局约定

- 以手机端视觉稿为准组织页面结构。
- 设计稿中的满宽 `750`，在实现语义上等价于铺满容器。
- 所以常见理解可以是：`750 设计稿宽度 = w-[750px] 的设计语义 = w-full 的实现语义`。
- 页面根容器默认参考下方结构，content 区域是主要内容区，scroll-box 是可滚动区域，size-full 是满宽满高的容器：

```
  <div class="size-full">
    <section class="scroll-box index">
      <main class="content"></main>
    </section>
  </div>
```

- 写页面时优先使用 `w-full`、`h-full`、`min-h-screen` 这类相对容器的写法。
- 只有确实需要固定尺寸的元素，才写具体尺寸类，且统一使用简写形式，如 `w-100`、`h-80`。
- 页面主容器默认按手机端单列布局思考，不要默认引入双栏、栅格后台式布局。

## 编码原则

- 优先复用现有能力，不重复造轮子：
  - 页面路由放在 `src/pages`
  - 通用组件优先放/查 `src/components`，并按用途分类
  - hooks 优先放/查 `src/hooks`，并按用途分类
  - 工具函数优先放/查 `src/utils`
- 旧版能力统一放入 `legacy` 目录，新项目优先使用推荐版本。
- 自动组件名称包含目录名称，例如 `src/components/form/keyboard.vue` 对应 `FormKeyboard`。
- 不使用 `export *`，统一明确写出导出内容。
- 保持实现直接、清晰，不为了“通用性”提前抽过度复杂的抽象。
- 除非明确要求，不要添加大段注释、兼容性兜底代码或多套实现。
- 兼容目标默认按项目现状：移动端 H5，兼容到 iOS 13、Chrome 89 附近即可。

## 样式规则

- 优先使用 Tailwind 原子类完成布局和间距。
- 自定义样式统一放在 `src/assets/styles` 或组件内 `style` 中。
- 能用现有变量、现有类名表达的，不额外发明新语义。
- 不要把桌面端视觉稿的尺寸直接照搬到页面根容器；页面宽度跟随手机端稿和 rem 体系走。
- 固定宽高统一使用简化形式，例如 `w-100`、`h-80`，不要写 `w-[100px]`、`h-[80px]`。

## 请求与业务代码

- 请求统一走 `src/utils/request.ts`。
- 防重复提交优先用 `src/hooks/network/useLockRequest.ts`。
- 新增接口时优先放到 `src/api`，并补对应类型。

## 构建与发布

- 修改完成后执行 `pnpm check`。
- 默认不执行打包，除非用户明确要求。
- 普通构建优先使用 `pnpm build`，正式上传优先使用 `pnpm build:deploy`，测试上传优先使用 `pnpm build:deploy:test`。
- 只有明确需要跳过检查时，才使用 `pnpm build:only`、`pnpm deploy:prod` 或 `pnpm deploy:test`。

## 多语言

- 多语言默认关闭。
- 需要开启时，取消 `src/main.ts` 中导入和启用 `i18n` 的两行注释。
- 页面切换语言统一使用 `src/locales` 导出的 `setLocale`。

## 给 Agent 的一句话

- 把这个项目当成“默认手机端、750 设计稿、PC 只做自动居中预览”的 H5 工程来写。
