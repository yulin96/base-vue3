import type { ConfigProviderThemeVars } from 'vant'

export function toVw(text: string, screenSize = 750): string {
  if (!text.endsWith('px')) return text

  const px = parseFloat(text.replace('px', ''))
  if (isNaN(px)) return text

  return `${((px / screenSize) * 100).toFixed(5).replace(/\.?0+$/, '')}vw`
}

export function convertConfigToPx(config?: ConfigProviderThemeVars, screenSize = 750): ConfigProviderThemeVars {
  if (!config) return {}

  const result: ConfigProviderThemeVars = {}

  for (const [key, value] of Object.entries(config)) {
    result[key] = typeof value === 'number' ? value : toVw(String(value), screenSize)
  }

  return result
}
