import type { CSSOptions } from 'vite'

type PostcssPlugin = NonNullable<Exclude<NonNullable<CSSOptions['postcss']>, string>['plugins']>[number]

const COMPAT_TRANSFORM =
  'translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), var(--tw-translate-z, 0)) ' +
  'rotate(var(--tw-compat-rotate, 0deg)) ' +
  'scale3d(var(--tw-compat-scale-x, 1), var(--tw-compat-scale-y, 1), var(--tw-compat-scale-z, 1))'
const TRANSFORM_AXES = ['x', 'y', 'z']

function toScaleNumber(value: string): string {
  const trimmed = value.trim()
  const percentMatch = /^(-?\d+(?:\.\d+)?)%$/.exec(trimmed)
  if (!percentMatch) return trimmed
  return String(Number(percentMatch[1]) / 100)
}

function isSimpleAngleValue(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'none') return false
  // 仅处理 2D 角度（如 45deg / calc(12deg * -1) / 0.5turn），跳过 3D 轴语法（如 x 45deg）
  return !/^[xyz]\s+/i.test(trimmed) && !/^-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+/.test(trimmed)
}

export function legacyCssCompat(): PostcssPlugin {
  return {
    postcssPlugin: 'legacy-css-compat',
    Once(root, { AtRule, Declaration, Rule }) {
      // 1. 解包 Tailwind v4 的 @layer properties，移除空声明，并拆分 Safari < 15.4 不支持的 ::backdrop
      root.walkAtRules('layer', (atRule) => {
        if (atRule.params.trim() !== 'properties') return
        if (!atRule.nodes?.length) {
          atRule.remove()
          return
        }

        atRule.walkRules((rule) => {
          const selectors = rule.selectors
          if (selectors.length > 1 && selectors.includes('::backdrop')) {
            const backdropRule = rule.cloneAfter({ selector: '::backdrop' })
            rule.selectors = selectors.filter((selector) => selector !== '::backdrop')
            if (!rule.selectors.length) backdropRule.remove()
          }
        })

        atRule.replaceWith(...atRule.nodes)
      })

      const rules: Parameters<Parameters<typeof root.walkRules>[0]>[0][] = []
      root.walkRules((rule) => {
        rules.push(rule)
      })

      const transformDefaults = new Rule({ selector: '*' })
      for (const axis of TRANSFORM_AXES) {
        transformDefaults.append(new Declaration({ prop: `--tw-translate-${axis}`, value: '0' }))
        transformDefaults.append(new Declaration({ prop: `--tw-compat-scale-${axis}`, value: '1' }))
      }
      transformDefaults.append(new Declaration({ prop: '--tw-compat-rotate', value: '0deg' }))
      const transformSupportQuery = 'not (translate: 0)'

      for (const rule of rules) {
        const parent = rule.parent
        const insideSupports = parent?.type === 'atrule' && parent.name === 'supports'
        const insideKeyframes = parent?.type === 'atrule' && parent.name.endsWith('keyframes')
        if (insideSupports || insideKeyframes) continue

        // 2. 为 iOS 13–14.4 / Chrome 87–103 的独立变换属性提供 @supports not (translate: 0) 组合 transform 回退
        let hasTransform = false
        let translateDecl: string | null = null
        let scaleDecl: string | null = null
        let rotateDecl: string | null = null
        const twScaleVars: Record<string, string> = {}

        for (const node of rule.nodes) {
          if (node.type !== 'decl') continue
          if (node.prop === 'transform') hasTransform = true
          else if (node.prop === 'translate') translateDecl = node.value
          else if (node.prop === 'scale') scaleDecl = node.value
          else if (node.prop === 'rotate') rotateDecl = node.value
          else if (node.prop === '--tw-scale-x' || node.prop === '--tw-scale-y' || node.prop === '--tw-scale-z') {
            twScaleVars[node.prop] = node.value
          }
        }

        if (!hasTransform && (translateDecl || scaleDecl || rotateDecl)) {
          const fallbackRule = new Rule({ selector: rule.selector })

          if (translateDecl === 'none') {
            for (const axis of TRANSFORM_AXES) {
              fallbackRule.append(new Declaration({ prop: `--tw-translate-${axis}`, value: '0' }))
            }
          } else if (translateDecl && !translateDecl.includes('var(--tw-translate-')) {
            const parts = translateDecl.trim().split(/\s+/)
            if (parts[0] && parts[0] !== 'none') {
              fallbackRule.append(new Declaration({ prop: '--tw-translate-x', value: parts[0] }))
              if (parts[1]) fallbackRule.append(new Declaration({ prop: '--tw-translate-y', value: parts[1] }))
              if (parts[2]) fallbackRule.append(new Declaration({ prop: '--tw-translate-z', value: parts[2] }))
            }
          }

          if (scaleDecl === 'none') {
            for (const axis of TRANSFORM_AXES) {
              fallbackRule.append(new Declaration({ prop: `--tw-compat-scale-${axis}`, value: '1' }))
            }
          } else if (scaleDecl) {
            if (Object.keys(twScaleVars).length > 0) {
              if (twScaleVars['--tw-scale-x']) {
                fallbackRule.append(
                  new Declaration({ prop: '--tw-compat-scale-x', value: toScaleNumber(twScaleVars['--tw-scale-x']) }),
                )
              }
              if (twScaleVars['--tw-scale-y']) {
                fallbackRule.append(
                  new Declaration({ prop: '--tw-compat-scale-y', value: toScaleNumber(twScaleVars['--tw-scale-y']) }),
                )
              }
              if (twScaleVars['--tw-scale-z']) {
                fallbackRule.append(
                  new Declaration({ prop: '--tw-compat-scale-z', value: toScaleNumber(twScaleVars['--tw-scale-z']) }),
                )
              }
            } else {
              const parts = scaleDecl.trim().split(/\s+/)
              if (parts[0]) {
                const sx = toScaleNumber(parts[0])
                const sy = parts[1] ? toScaleNumber(parts[1]) : sx
                fallbackRule.append(new Declaration({ prop: '--tw-compat-scale-x', value: sx }))
                fallbackRule.append(new Declaration({ prop: '--tw-compat-scale-y', value: sy }))
                if (parts[2]) {
                  fallbackRule.append(new Declaration({ prop: '--tw-compat-scale-z', value: toScaleNumber(parts[2]) }))
                }
              }
            }
          }

          if (rotateDecl && (rotateDecl === 'none' || isSimpleAngleValue(rotateDecl))) {
            fallbackRule.append(
              new Declaration({ prop: '--tw-compat-rotate', value: rotateDecl === 'none' ? '0deg' : rotateDecl }),
            )
          }

          fallbackRule.append(new Declaration({ prop: 'transform', value: COMPAT_TRANSFORM }))
          if (!transformDefaults.parent) {
            const defaultsBlock = new AtRule({ name: 'supports', params: transformSupportQuery })
            defaultsBlock.append(transformDefaults)
            const lastImport = root.nodes.findLast(
              (node) => node.type === 'atrule' && /^(import|charset)$/.test(node.name),
            )
            if (lastImport) root.insertAfter(lastImport, defaultsBlock)
            else root.prepend(defaultsBlock)
          }
          const supportsBlock = new AtRule({ name: 'supports', params: transformSupportQuery })
          supportsBlock.append(fallbackRule)
          rule.after(supportsBlock)
        }

        // 3. 由入口检测 :where()，Safari 14.0 已支持选择器本身，但还不支持 @supports selector()
        const whereMatch = /^:where\((.+)\)$/.exec(rule.selector.trim())
        if (whereMatch && /\.(space-[xy]|divide-[xy])\b/.test(whereMatch[1])) {
          rule.after(rule.clone({ selector: `html.no-css-where ${whereMatch[1]}` }))
        }
      }
    },
  }
}
