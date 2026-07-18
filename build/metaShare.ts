import type { Plugin } from 'vite'

export interface VitePluginMetaShareOption {
  enable?: boolean
  title?: string
  description?: string
  link?: string
  image?: string
}

const escapeHtmlAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const createMetaTag = (type: 'name' | 'property', key: string, content?: string): string | null => {
  if (!content) return null
  return `<meta ${type}="${key}" content="${escapeHtmlAttribute(content)}">`
}

const createLinkTag = (rel: string, href?: string, type?: string): string | null => {
  if (!href) return null
  const typeAttribute = type ? ` type="${type}"` : ''
  return `<link rel="${rel}"${typeAttribute} href="${escapeHtmlAttribute(href)}" />`
}

const createMetaShareTags = (option: VitePluginMetaShareOption): string[] =>
  [
    createMetaTag('property', 'og:title', option.title),
    createMetaTag('property', 'og:description', option.description),
    createMetaTag('property', 'og:url', option.link),
    createMetaTag('property', 'og:image', option.image),
    option.title ? '<meta name="twitter:card" content="summary">' : null,
    createMetaTag('name', 'twitter:title', option.title),
    createMetaTag('name', 'twitter:description', option.description),
    createMetaTag('name', 'twitter:url', option.link),
    createMetaTag('name', 'twitter:image', option.image),
    createMetaTag('name', 'description', option.description),
    createLinkTag('shortcut icon', option.image, 'text/css'),
    createLinkTag('apple-touch-icon', option.image),
  ].filter((tag): tag is string => Boolean(tag))

const injectMetaShareTags = (html: string, tags: string[]): string => {
  if (tags.length === 0) return html

  const lineBreak = html.includes('\r\n') ? '\r\n' : '\n'
  const headMatch = /<head\b[^>]*>/i.exec(html)
  if (!headMatch) return html

  const metaHtml = tags.map((tag) => `    ${tag}`).join(lineBreak)
  const insertIndex = headMatch.index + headMatch[0].length
  return `${html.slice(0, insertIndex)}${lineBreak}${metaHtml}${html.slice(insertIndex)}`
}

export function vitePluginMetaShare(option: VitePluginMetaShareOption): Plugin {
  return {
    name: 'vite-plugin-meta-share',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      if (!option.enable) return html
      return injectMetaShareTags(html, createMetaShareTags(option))
    },
  }
}
