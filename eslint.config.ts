import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

export default defineConfigWithVueTs(
  {
    name: 'app/vue-files-to-lint',
    files: ['**/*.vue'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/output/**', '**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}']),

  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.base,

  eslintConfigPrettier,
  ...pluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),

  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
