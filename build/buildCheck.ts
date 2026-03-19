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
  plain: string
  colored: string
}

const getWidth = (text: string) =>
  [...text].reduce(
    (total, char) =>
      total +
      (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/.test(
        char,
      )
        ? 2
        : 1),
    0,
  )

const trimText = (text: string, maxWidth: number) => {
  if (getWidth(text) <= maxWidth) return text

  let width = 0
  let result = ''

  for (const char of text) {
    const charWidth = getWidth(char)
    if (width + charWidth > maxWidth - 3) break
    result += char
    width += charWidth
  }

  return `${result}...`
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

const getCellWidth = (items: RenderedCheckItem[]) => Math.max(...items.map((item) => getWidth(item.plain)))

const padItems = (items: RenderedCheckItem[], gap: string, cellWidth = getCellWidth(items)) =>
  items.map((item) => item.colored + ' '.repeat(Math.max(cellWidth - getWidth(item.plain), 0))).join(gap)

const getAlignedRowWidth = (count: number, cellWidth: number, gap: string) =>
  cellWidth * count + getWidth(gap) * Math.max(count - 1, 0)

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
  const gap = '    '
  const title = `${cyan.bold('Build Env Check')} ${dim(`· ${mode}`)}`
  const terminalWidth = process.stdout?.columns || 100
  const valueWidth = terminalWidth >= 140 ? 28 : 18
  const renderItem = (check: EnvCheckItem): RenderedCheckItem => {
    const configured = resolveConfigured(check)
    const markerText = configured ? '●' : '○'
    const valueText = trimText(resolveDisplayValue(check), valueWidth)

    return {
      plain: `${markerText} ${check.label}: ${valueText}`,
      colored: `${configured ? green(markerText) : yellow(markerText)} ${bold(check.label)}${dim(':')} ${configured ? green(valueText) : dim(valueText)}`,
    }
  }

  const renderGroup = (keys: string[]) =>
    keys
      .map((key) => checks.find((check) => check.key === key))
      .filter(Boolean)
      .map((check) => renderItem(check as EnvCheckItem))
  const standaloneItems = renderGroup(['title', 'storage'])
  const statsItems = renderGroup(['arms', 'hm'])
  const uploadItems = renderGroup(['ftp', 'oss'])
  const shareItems = renderGroup(['shareTitle', 'shareDesc', 'shareLink', 'shareImage'])
  const gridCellWidth = getCellWidth([...statsItems, ...uploadItems, ...shareItems])
  const shareCellWidth = getCellWidth(shareItems)
  const shareColumnCount =
    terminalWidth >= shareCellWidth * shareItems.length + getWidth(gap) * (shareItems.length - 1)
      ? shareItems.length
      : terminalWidth >= shareCellWidth * 2 + getWidth(gap)
        ? 2
        : 1
  const shareRows = Array.from({ length: Math.ceil(shareItems.length / shareColumnCount) }, (_, index) =>
    shareItems.slice(index * shareColumnCount, (index + 1) * shareColumnCount),
  )
  const dividerWidth = Math.min(
    Math.max(
      ...standaloneItems.map((item) => getWidth(item.plain)),
      getAlignedRowWidth(statsItems.length, gridCellWidth, gap),
      getAlignedRowWidth(uploadItems.length, gridCellWidth, gap),
      ...shareRows.map((row) => getAlignedRowWidth(row.length, gridCellWidth, gap)),
      32,
    ),
    96,
  )
  const divider = dim('─'.repeat(dividerWidth))
  const missingCount = checks.filter((check) => !resolveConfigured(check)).length
  const configuredCount = checks.length - missingCount

  console.log('')
  console.log(title)
  console.log(divider)

  for (const item of standaloneItems) {
    console.log(item.colored)
  }

  console.log(padItems(statsItems, gap, gridCellWidth))
  console.log(padItems(uploadItems, gap, gridCellWidth))

  for (const row of shareRows) {
    console.log(padItems(row, gap, gridCellWidth))
  }

  console.log(divider)
  console.log(
    missingCount === 0
      ? green(`${bold('配置完整')} · ${configuredCount}/${checks.length} 项已就绪`)
      : yellow(`${bold('待补充')} · ${missingCount}/${checks.length} 项未配置`),
  )
  console.log('')
}
