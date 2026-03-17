import fs from 'node:fs'
import path from 'node:path'

const preservedEntries = new Set(['.git', 'node_modules'])

export function canSkipEmptying(dir: string) {
  if (!fs.existsSync(dir)) {
    return true
  }

  const files = fs.readdirSync(dir)

  return files.every(file => preservedEntries.has(file))
}

export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }

  for (const file of fs.readdirSync(dir)) {
    if (preservedEntries.has(file)) {
      continue
    }

    fs.rmSync(path.join(dir, file), {
      recursive: true,
      force: true,
    })
  }
}

export function formatShellPath(value: string) {
  return /\s/.test(value) ? `"${value}"` : value
}
