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
 * - list1-list20 使用 setupElectronConfig / defineProjectFields 声明名称、类型、默认值；检查字段错误后使用返回配置。
 * - 配置文件读写仅限客户端 F12 设置窗口；list1-list20 按完整 resourceUrl 隔离。
 * - defineDisplayNames(names) 只修改非 list 字段名称；list 字段用 defineProjectFields，用户设置不会被默认值升级覆盖。
 * - hideConfig(targets) 可隐藏字段或分组；hideAllConfig() 本次运行期间不可恢复，只有明确需求时才能调用。
 * - 客户端设置保存后重启；临时全屏切换使用 enterFullscreen()/exitFullscreen()。
 * - 所有 Promise 接口都要处理失败。对业务有影响的失败不能静默忽略；普通浏览器缺少 API 时使用明确的页面默认行为。
 * - onScreenMessage() 返回取消监听函数，组件卸载时必须调用；sendToScreen() 返回 true 只表示消息已投递。
 * - quit()、restart() 属于高影响操作，调用前必须由业务完成保存和用户确认。
 */
export const electronApi = window.api

export const appStorageName = import.meta.env.VITE_APP_LOCALSTORAGE_NAME || `${location.origin}${location.pathname}`
