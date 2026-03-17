import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const playgroundDir = path.resolve(scriptDir, '../playground/dev-app')

await fs.rm(playgroundDir, {
  recursive: true,
  force: true,
})

console.log(`Playground cleaned: ${playgroundDir}`)
