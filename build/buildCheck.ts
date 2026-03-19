import type { PluginOption } from 'vite'

type EnvCheckItem = {
  key: string
  label: string
  value?: string
  activeValue?: string
  activeText?: string
  inactiveText?: string
}

type RenderedCheckItem = {
  colored: string
}

const isToggleCheck = (check: EnvCheckItem) => typeof check.activeValue === 'string'

const resolveConfigured = (check: EnvCheckItem) => {
  const rawValue = check.value?.trim()
  return isToggleCheck(check) ? rawValue === check.activeValue : !!rawValue
}

const resolveDisplayValue = (check: EnvCheckItem) => {
  const rawValue = check.value?.trim()

  if (!isToggleCheck(check)) return rawValue || '未定义'

  return rawValue === check.activeValue ? check.activeText || '已开启' : check.inactiveText || '未开启'
}

const escapeLineBreaks = (text: string) => text.replace(/\r?\n/g, '\\n')

const renderLine = (items: RenderedCheckItem[]) => items.map((item) => item.colored).join('    ')

export function buildCheck(env: Record<string, string>, mode: string): PluginOption {
  return {
    name: 'build-check',
    apply: 'build',
    buildStart() {
      void handleCheck(env, mode)
    },
  }
}

async function handleCheck(env: Record<string, string>, mode: string) {
  const { default: chalk } = await import('chalk')
  const { bold, cyan, dim, green, yellow } = chalk
  const checks: EnvCheckItem[] = [
    { key: 'title', label: '网站标题', value: env.VITE_APP_TITLE },
    { key: 'storage', label: '本地存储', value: env.VITE_APP_LOCALSTORAGE_NAME },
    {
      key: 'arms',
      label: '错误监控',
      value: env.VITE_APP_ARMS,
      activeValue: '1',
      activeText: '已开启',
      inactiveText: '未开启',
    },
    { key: 'hm', label: '百度统计', value: env.VITE_APP_HM_BAIDU },
    { key: 'ftp', label: 'FTP上传', value: env.VITE_FTP_DIRNAME },
    { key: 'oss', label: 'OSS上传', value: env.VITE_OSS_ROOT_DIR },
    { key: 'shareTitle', label: '分享标题', value: env.VITE_APP_SHARE_TITLE },
    { key: 'shareDesc', label: '分享描述', value: env.VITE_APP_SHARE_DESC },
    { key: 'shareLink', label: '分享链接', value: env.VITE_APP_SHARE_LINK },
    { key: 'shareImage', label: '分享图片', value: env.VITE_APP_SHARE_IMGURL },
  ]
  const title = `${cyan.bold('Build Env Check')} ${dim(`· ${mode}`)}`
  const terminalWidth = process.stdout?.columns || 100
  const renderItem = (check: EnvCheckItem): RenderedCheckItem => {
    const configured = resolveConfigured(check)
    const markerText = configured ? '●' : '○'
    const valueText = escapeLineBreaks(resolveDisplayValue(check))

    return {
      colored: `${configured ? green(markerText) : yellow(markerText)} ${bold(check.label)}${dim(':')} ${configured ? green(valueText) : dim(valueText)}`,
    }
  }
  const getRenderedItems = (keys: string[]) =>
    keys
      .map((key) => checks.find((check) => check.key === key))
      .filter(Boolean)
      .map((check) => renderItem(check as EnvCheckItem))

  const standaloneItems = getRenderedItems(['title', 'storage', 'shareTitle', 'shareDesc', 'shareLink', 'shareImage'])
  const statsItems = getRenderedItems(['arms', 'hm'])
  const uploadItems = getRenderedItems(['oss', 'ftp'])
  const dividerWidth = Math.min(Math.max(terminalWidth - 2, 32), 96)
  const divider = dim('─'.repeat(dividerWidth))
  const missingCount = checks.filter((check) => !resolveConfigured(check)).length
  const configuredCount = checks.length - missingCount

  console.log('')
  console.log(title)
  console.log(divider)

  for (const item of standaloneItems.slice(0, 2)) {
    console.log(item.colored)
  }

  console.log(renderLine(statsItems))
  console.log(renderLine(uploadItems))

  for (const item of standaloneItems.slice(2)) {
    console.log(item.colored)
  }

  console.log(divider)
  console.log(
    missingCount === 0
      ? green(`${bold('配置完整')} · ${configuredCount}/${checks.length} 项已就绪`)
      : yellow(`${bold('待补充')} · ${missingCount}/${checks.length} 项未配置`),
  )
  console.log('')
}
