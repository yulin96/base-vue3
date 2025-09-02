import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { configureVueProject, defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

// 是否解析 Vue 模板中的 TypeScript 语法，设置为 false可能会提高性能。
configureVueProject({ tsSyntaxInTemplates: true })

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    rules: {
      'no-debugger': 0,
      'no-empty': 1,
      'no-prototype-builtins': 0,
      'no-undef': 0,
      'no-unused-vars': 0,

      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-expressions': 0,
      '@typescript-eslint/no-unused-vars': 0,
      'prefer-rest-params': 0,

      'vue/multi-word-component-names': 0,
    },
  },
)
