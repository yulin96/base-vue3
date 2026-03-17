#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { canSkipEmptying, emptyDir, formatShellPath } from './utils/fs.js'
import { getCommand, inferPackageManager } from './utils/packageManager.js'
import { isValidPackageName, toValidPackageName } from './utils/packageName.js'
import { promptConfirm, promptText } from './utils/prompt.js'
import { renderTemplate } from './utils/renderTemplate.js'

type CliPackageJson = {
  name: string
  version: string
}

const cliPackageJson = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as CliPackageJson

const helpMessage = `Usage: ${cliPackageJson.name} [options] [directory]

Create a new project from the internal Vue 3 template.

Options:
  --force     Overwrite target directory files
  --help      Show this help message
  --version   Show the current CLI version`

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      force: {
        type: 'boolean',
      },
      help: {
        type: 'boolean',
      },
      version: {
        type: 'boolean',
      },
    },
    allowPositionals: true,
  })

  if (values.help) {
    console.log(helpMessage)
    return
  }

  if (values.version) {
    console.log(cliPackageJson.version)
    return
  }

  const cwd = process.cwd()
  const inputDir = positionals[0]
  const defaultProjectName = inputDir === '.' ? path.basename(cwd) : inputDir ?? 'base-vue3-app'
  let targetDir = inputDir

  if (!targetDir) {
    targetDir = await promptText('项目目录名', defaultProjectName)
  }

  const root = path.resolve(cwd, targetDir)
  const projectName = path.basename(root)
  let packageName = projectName

  if (!canSkipEmptying(root) && !values.force) {
    const shouldOverwrite = await promptConfirm(
      `目标目录 ${formatShellPath(path.relative(cwd, root) || '.')} 非空，是否继续覆盖模板文件？`,
      false,
    )

    if (!shouldOverwrite) {
      console.log('已取消。')
      return
    }
  }

  if (!isValidPackageName(packageName)) {
    packageName = await promptText('package name', toValidPackageName(packageName))

    if (!isValidPackageName(packageName)) {
      throw new Error('package name 不合法，请重新指定目录名或 package name。')
    }
  }

  if (fs.existsSync(root) && (values.force || !canSkipEmptying(root))) {
    emptyDir(root)
  } else {
    fs.mkdirSync(root, { recursive: true })
  }

  const templateDir = fileURLToPath(new URL('../template/base', import.meta.url))

  renderTemplate(templateDir, root)
  updatePackageJson(root, packageName)

  const packageManager = inferPackageManager()
  const relativeRoot = path.relative(cwd, root) || '.'

  console.log('')
  console.log(`已创建项目 ${projectName}`)
  console.log('')
  console.log('下一步：')
  if (relativeRoot !== '.') {
    console.log(`  cd ${formatShellPath(relativeRoot)}`)
  }
  console.log(`  ${getCommand(packageManager, 'install')}`)
  console.log(`  ${getCommand(packageManager, 'dev')}`)
}

function updatePackageJson(root: string, packageName: string) {
  const packageJsonPath = path.join(root, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>

  packageJson.name = packageName
  packageJson.version = '0.0.0'

  delete packageJson.author
  delete packageJson.repository

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
