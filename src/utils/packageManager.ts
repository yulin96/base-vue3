import process from 'node:process'

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export function inferPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? ''

  if (userAgent.startsWith('yarn')) {
    return 'yarn'
  }

  if (userAgent.startsWith('bun')) {
    return 'bun'
  }

  if (userAgent.startsWith('npm')) {
    return 'npm'
  }

  return 'pnpm'
}

export function getCommand(packageManager: PackageManager, action: 'install' | 'dev') {
  if (action === 'install') {
    if (packageManager === 'yarn') {
      return 'yarn'
    }

    if (packageManager === 'bun') {
      return 'bun install'
    }

    return `${packageManager} install`
  }

  if (packageManager === 'npm') {
    return 'npm run dev'
  }

  if (packageManager === 'bun') {
    return 'bun run dev'
  }

  return `${packageManager} dev`
}
