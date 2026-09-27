# 单元测试

使用 Vitest v5、jsdom 和 Vue Test Utils。测试文件放在 `tests/**/*.test.ts`，直接导入业务模块，用 `vi.mock` 隔离网络与平台能力。

```sh
pnpm test:unit                          # 监听模式
pnpm test:unit:run                      # 单次运行全部单元测试
pnpm test:unit:run tests/router-history.test.ts # 只验证路由历史
pnpm check                             # 类型检查（包含测试）和 lint
```

`vitest.config.ts` 独立加载 Vue 插件与 `@` 别名，不合并带有上传、图片处理等插件的业务 Vite 配置。参考新 Vue 项目的 jsdom、测试类型配置及 ESLint 接入方式，保留本项目 `tests` 目录。

- 路由：真实 Vue Router 内存路由与 sessionStorage，覆盖指定返回、历史回退和导航失败。
- 组件：挂载音频与返回按钮，验证卸载清理和点击参数。
- MQTT：模拟 ROP 事件，验证重复消息、频道过滤与卸载后迟到消息。
- 请求锁：使用虚拟计时器和请求 mock，验证并发、冷却、失败和取消。
- Electron 配置与统计：模拟 IPC，验证声明校验、初始化、并发及错误返回；启动入口只 mock 平台副作用。

这些测试不连接真实服务、不启动浏览器，也不证明实机音频、微信、Electron 或 MQTT 网络行为。
