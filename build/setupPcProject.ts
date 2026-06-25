import { cancel, confirm, intro, isCancel, note, outro, text } from '@clack/prompts'
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

const root = process.cwd()
const { values } = parseArgs({
  options: {
    width: { type: 'string' },
    height: { type: 'string' },
    yes: { type: 'boolean', default: false },
  },
})

intro('切换为 PC 项目模式')

const pageWidth = values.width ? parsePositiveInteger(values.width, 'width') : await askPositiveInteger('请输入设计稿宽度', '1920')
const pageHeight = values.height
  ? parsePositiveInteger(values.height, 'height')
  : await askPositiveInteger('请输入设计稿高度', '1080')

const shouldApply =
  values.yes ||
  (await confirm({
    message: `确认按 ${pageWidth} x ${pageHeight} 切换为 PC 项目模式？`,
    initialValue: true,
  }))

if (isCancel(shouldApply) || !shouldApply) {
  cancel('已取消')
  process.exit(0)
}

const changed: string[] = []

commentPxtorem()
updateMainCss()
updateTailwindCss()
updateThemeCss(pageWidth, pageHeight)
replaceAgents()

note(changed.length ? changed.join('\n') : '没有需要修改的文件。', '已修改文件')
outro('PC 项目模式切换完成')

async function askPositiveInteger(message: string, initialValue: string) {
  const value = await text({
    message,
    initialValue,
    validate(input) {
      const numberValue = Number(input)
      if (!Number.isInteger(numberValue) || numberValue <= 0) return '请输入大于 0 的整数'
    },
  })

  if (isCancel(value)) {
    cancel('已取消')
    process.exit(0)
  }

  return Number(value)
}

function parsePositiveInteger(value: string, name: string) {
  const numberValue = Number(value)
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${name} 必须是大于 0 的整数`)
  }

  return numberValue
}

function commentPxtorem() {
  const filePath = resolvePath('vite.config.ts')
  const source = readFile(filePath)
  const result = commentCall(source, 'pxtorem')
  writeChanged(filePath, source, result)
}

function updateMainCss() {
  const filePath = resolvePath('src/assets/styles/main.css')
  const source = readFile(filePath)
  const result = commentCssImport(source, './rem.m.css')
  writeChanged(filePath, source, result)
}

function updateTailwindCss() {
  const filePath = resolvePath('src/assets/styles/tailwind.css')
  const source = readFile(filePath)
  let result = commentCssImport(source, './size.css')
  result = result.replaceAll('calc(--value(integer) * 1px)', 'calc(--value(integer) * 0.25rem)')
  writeChanged(filePath, source, result)
}

function updateThemeCss(width: number, height: number) {
  const filePath = resolvePath('src/assets/styles/theme.css')
  const source = readFile(filePath)
  let result = source.replace(/^(\s*)--spacing:\s*1px;$/m, '$1/* --spacing: 1px; */')

  const htmlBlock = [
    'html {',
    `  --page-width: ${width};`,
    `  --page-height: ${height};`,
    '',
    '  --page-width-size: calc(100vw / var(--page-width) * 4);',
    '  --page-height-size: calc(100vh / var(--page-height) * 4);',
    '',
    '  font-size: min(var(--page-width-size), var(--page-height-size));',
    '}',
  ].join('\n')

  const commentedHtmlPattern = /\/\*\s*html\s*\{[\s\S]*?font-size:\s*min\(var\(--page-width-size\),\s*var\(--page-height-size\)\);\s*\}\s*\*\//
  const activeHtmlPattern = /html\s*\{[\s\S]*?font-size:\s*min\(var\(--page-width-size\),\s*var\(--page-height-size\)\);\s*\}/

  if (commentedHtmlPattern.test(result)) {
    result = result.replace(commentedHtmlPattern, htmlBlock)
  } else if (activeHtmlPattern.test(result)) {
    result = result.replace(activeHtmlPattern, htmlBlock)
  } else {
    result = `${htmlBlock}\n\n${result}`
  }

  writeChanged(filePath, source, result)
}

function replaceAgents() {
  const agentsPath = resolvePath('AGENTS.md')
  const pcAgentsPath = resolvePath('AGENTS-PC.md')

  if (!existsSync(pcAgentsPath)) return

  if (existsSync(agentsPath)) unlinkSync(agentsPath)
  renameSync(pcAgentsPath, agentsPath)
  changed.push(relativePath(agentsPath))
}

function commentCssImport(source: string, importPath: string) {
  const escapedPath = escapeRegExp(importPath)
  const pattern = new RegExp(`^(@import ['"]${escapedPath}['"];)$`, 'm')
  return source.replace(pattern, '/* $1 */')
}

function commentCall(source: string, callee: string) {
  const callStart = source.indexOf(`${callee}(`)
  if (callStart === -1) return source

  const nearbyPrefix = source.slice(Math.max(0, callStart - 4), callStart)
  if (nearbyPrefix.includes('/*')) return source

  const openBrace = source.indexOf('{', callStart)
  if (openBrace === -1) return source

  let index = openBrace + 1
  let depth = 1
  let quote = ''

  while (index < source.length) {
    const char = source[index]
    const prev = source[index - 1]

    if (quote) {
      if (char === quote && prev !== '\\') quote = ''
      index += 1
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      index += 1
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') depth -= 1

    if (depth === 0) break
    index += 1
  }

  if (depth !== 0) return source

  let end = index + 1
  while (/\s/.test(source[end] || '')) end += 1
  if (source[end] === ')') end += 1
  if (source[end] === ',') end += 1

  const original = source.slice(callStart, end)
  const commented = `/* ${original} */`
  return `${source.slice(0, callStart)}${commented}${source.slice(end)}`
}

function readFile(filePath: string) {
  if (!existsSync(filePath)) throw new Error(`缺少文件：${relativePath(filePath)}`)
  return readFileSync(filePath, 'utf8')
}

function writeChanged(filePath: string, before: string, after: string) {
  if (before === after) return
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, after)
  changed.push(relativePath(filePath))
}

function resolvePath(filePath: string) {
  return path.resolve(root, filePath)
}

function relativePath(filePath: string) {
  return path.relative(root, filePath).replaceAll(path.sep, '/')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
