import fs from 'node:fs'
import path from 'node:path'

const ignoredEntries = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  '.vite',
  '.playwright-cli',
  '__temp',
  'coverage',
  'stats.html',
])

export function renderTemplate(source: string, destination: string) {
  const stats = fs.statSync(source)

  if (stats.isDirectory()) {
    if (ignoredEntries.has(path.basename(source))) {
      return
    }

    fs.mkdirSync(destination, { recursive: true })

    for (const entry of fs.readdirSync(source)) {
      renderTemplate(path.join(source, entry), path.join(destination, entry))
    }

    return
  }

  const filename = path.basename(source)
  let targetPath = destination

  if (filename.startsWith('_')) {
    targetPath = path.join(path.dirname(destination), filename.replace(/^_/, '.'))
  }

  if (filename === '_gitignore' && fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, 'utf8')
    const next = fs.readFileSync(source, 'utf8')

    fs.writeFileSync(targetPath, `${existing}\n${next}`)
    return
  }

  fs.copyFileSync(source, targetPath)
}
