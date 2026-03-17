import process from 'node:process'
import readline from 'node:readline/promises'

function ensureInteractive() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('当前终端不可交互，请直接传入目录参数。')
  }
}

export async function promptText(message: string, defaultValue = '') {
  ensureInteractive()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const suffix = defaultValue ? ` (${defaultValue})` : ''
  const answer = await rl.question(`${message}${suffix}: `)
  rl.close()

  return answer.trim() || defaultValue
}

export async function promptConfirm(message: string, defaultValue = false) {
  ensureInteractive()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const hint = defaultValue ? '(Y/n)' : '(y/N)'
  const answer = await rl.question(`${message} ${hint} `)
  rl.close()

  if (!answer.trim()) {
    return defaultValue
  }

  return /^y(es)?$/i.test(answer.trim())
}
