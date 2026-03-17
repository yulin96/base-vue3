import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const command = process.argv[2]

if (!command) {
  console.error('缺少 playground 命令。')
  process.exit(1)
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const playgroundDir = path.resolve(scriptDir, '../playground/dev-app')
const commandLine =
  command === 'install' ? 'pnpm --ignore-workspace install' : `pnpm --ignore-workspace ${command}`

const child = spawn(commandLine, {
  cwd: playgroundDir,
  shell: true,
  stdio: 'inherit',
})

child.on('exit', code => {
  process.exit(code ?? 0)
})

child.on('error', error => {
  console.error(error.message)
  process.exit(1)
})
