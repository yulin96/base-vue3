/**
 * 当前应用是否为生产模式
 */
export const prodModel = import.meta.env.PROD

/**
 * 当前应用是否为开发模式
 */
export const devModel = import.meta.env.DEV

/**
 * 当前应用是否为测试模式
 */
export const isTestURL = location.href.includes('__test__')

/**
 * 获取 Electron API 对象
 *
 * 使用约定（修改 Electron 相关业务前先阅读）：
 * - API 由客户端 preload 注入，普通浏览器中可能为 undefined，且客户端可能只提供部分接口；调用时使用可选链。
 * - 类型声明统一维护在 types/electron.d.ts。新增或升级客户端接口时，先与客户端 preload 和共享类型保持一致。
 * - electronApi.config 是 preload 加载时的启动快照，不会自动刷新；需要当前配置时使用 getConfig()。
 * - defineConfig(patch) 只局部写入传入字段。设置默认值时应先 getConfig()，仅为空字段补默认值，不能覆盖用户已有配置。
 * - defineDisplayNames(names) 只修改配置面板显示名称，不修改配置值；客户端重启后业务页面需要重新调用。
 * - hideConfig(targets) 可隐藏字段或分组；hideAllConfig() 本次运行期间不可恢复，只有明确需求时才能调用。
 * - defineConfig() 写入配置不代表所有启动配置会立即生效；全屏切换应使用 enterFullscreen()/exitFullscreen()。
 * - 所有 Promise 接口都要处理失败。对业务有影响的失败不能静默忽略；普通浏览器缺少 API 时使用明确的页面默认行为。
 * - onScreenMessage() 返回取消监听函数，组件卸载时必须调用；sendToScreen() 返回 true 只表示消息已投递。
 * - quit()、restart() 属于高影响操作，调用前必须由业务完成保存和用户确认。
 */
export const electronApi = window.api

export const appStorageName = import.meta.env.VITE_APP_LOCALSTORAGE_NAME || `${location.origin}${location.pathname}`
