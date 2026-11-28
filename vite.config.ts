import path from 'node:path'

import pxtorem from '@minko-fe/postcss-pxtorem'
import tailwindcss from '@tailwindcss/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import VueRouter from 'vue-router/vite'

import { legacyCssCompat } from './build/legacyCssCompat.ts'

const splitDependencies: Record<string, string> = {
  gsap: 'gsap',
  lottie: 'lottie-web',
  dingtalk: 'dingtalk-jsapi',
  vueuse: '@vueuse/core',
}

const vantPackagePath = path.join('node_modules', 'vant')

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isBuild = command === 'build'
  const isTestDeploy = mode === 'deploy-test'
  const isDeployMode = mode === 'deploy' || isTestDeploy
  const resolveDeployDir = (dir?: string) => {
    const normalizedDir = (dir || '').trim().replace(/\/+$/, '')
    if (!normalizedDir) return ''
    return isTestDeploy ? `${normalizedDir}/__test__` : normalizedDir
  }
  const ossRootDir = resolveDeployDir(env.VITE_OSS_ROOT_DIR)
  const ftpDir = resolveDeployDir(env.VITE_FTP_DIRNAME)

  const preBuildPlugins: PluginOption[] = []
  const postBuildPlugins: PluginOption[] = []
  let postcssPresetEnvPlugin: ReturnType<(typeof import('postcss-preset-env'))['default']> | undefined

  if (isBuild) {
    const [
      { buildCheck },
      { vitePluginMetaShare },
      { vitePluginOrganizeResource },
      { default: legacy },
      { default: postcssPresetEnv },
      { visualizer },
      { ViteImageOptimizer },
      { vitePluginDeployFtp, vitePluginDeployOss },
    ] = await Promise.all([
      import('./build/buildCheck.ts'),
      import('./build/metaShare.ts'),
      import('./build/organizeResource.ts'),
      import('@vitejs/plugin-legacy'),
      import('postcss-preset-env'),
      import('rollup-plugin-visualizer'),
      import('vite-plugin-image-optimizer'),
      import('vite-plugin-upload'),
    ])

    postcssPresetEnvPlugin = postcssPresetEnv({
      browsers: ['ios >= 13', 'chrome >= 87', 'safari >= 13'],
      autoprefixer: {},
      features: {
        'cascade-layers': false,
      },
    })

    preBuildPlugins.push(
      buildCheck(env, mode),
      vitePluginMetaShare({
        enable: true,
        title: env.VITE_APP_SHARE_TITLE,
        description: env.VITE_APP_SHARE_DESC,
        link: env.VITE_APP_SHARE_LINK,
        image: env.VITE_APP_SHARE_IMGURL,
      }),
      ViteImageOptimizer({
        exclude: /\.(webp|svg)$/i,
        jpg: {
          quality: 90,
          progressive: true,
          mozjpeg: true,
        },
        png: {
          quality: 90,
          progressive: true,
          adaptiveFiltering: true,
        },
        cache: true,
        cacheLocation: 'node_modules/.cache-image/',
      }),
    )

    postBuildPlugins.push(
      legacy({
        modernTargets: ['chrome >= 87', 'safari >= 13', 'ios >= 13'],
        renderLegacyChunks: false,
        modernPolyfills: true,
        additionalModernPolyfills: ['core-js/es/object/has-own'],
      }),
      vitePluginDeployOss({
        open: !!ossRootDir && isDeployMode,
        accessKeyId: process.env.zAccessKeyId || '',
        accessKeySecret: process.env.zAccessKeySecret || '',
        bucket: process.env.zBucket || '',
        region: 'oss-cn-beijing',
        alias: process.env.zBucketAlias || '',
        uploadDir: `mm/oss-root/${ossRootDir}`,
        skip: ['**/*.html', '**/pluginWebUpdateNotice/**'],
        overwrite: true,
        autoDelete: true,

        configBase: `${process.env.zBucketAlias || ''}/mm/oss-root/${ossRootDir}`,
      }),
      vitePluginOrganizeResource({
        config: {
          IMG_RESOURCES: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
        },
      }),
      vitePluginDeployFtp({
        open: !!ftpDir && isDeployMode,
        uploadPath: ftpDir,
        singleBack: true,
        // autoUpload: true,
        // defaultFtp: process.env.zH5FtpName,
        ftps: [
          {
            name: process.env.zH5FtpName || process.env.zH5FtpAlias || '',
            host: process.env.zH5FtpHost,
            port: +(process.env.zH5FtpPort || 21),
            user: process.env.zH5FtpUser,
            password: process.env.zH5FtpPassword,
            alias: process.env.zH5FtpAlias,
          },
          {
            name: process.env.zH5FtpName2 || process.env.zH5FtpAlias2 || '',
            host: process.env.zH5FtpHost2,
            port: +(process.env.zH5FtpPort2 || 21),
            user: process.env.zH5FtpUser2,
            password: process.env.zH5FtpPassword2,
            alias: process.env.zH5FtpAlias2,
          },
          {
            name: process.env.zQRFtpName || process.env.zQRFtpAlias || '',
            host: process.env.zQRFtpHost,
            port: +(process.env.zQRFtpPort || 21),
            user: process.env.zQRFtpUser,
            password: process.env.zQRFtpPassword,
            alias: process.env.zQRFtpAlias,
          },
        ],
      }),
      {
        name: 'transformHtml',
        transformIndexHtml(html) {
          html = html.replace('<html', `<html build-time="${new Date().toLocaleString()}" `)

          const baiduScript = `
    <script>
      var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?${env.VITE_APP_HM_BAIDU}";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
      })();
    </script>`

          if (env.VITE_APP_HM_BAIDU) html = html.replace('<!-- baiduTongji -->', baiduScript)
          return html
        },
      },
      visualizer(),
    )
  }

  return {
    define: {
      __ARMSEndpoint: JSON.stringify(process.env.ARMSEndpoint),
    },
    plugins: [
      ...preBuildPlugins,
      VueRouter({
        dts: './types/route-map.d.ts',
        importMode: isBuild ? 'sync' : 'async',
      }),
      vue(),
      tailwindcss(),
      Components({
        dirs: ['src/components'],
        extensions: ['vue'],
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [VantResolver()],
        dts: './types/components.d.ts',
        directoryAsNamespace: true,
      }),
      ...postBuildPlugins,
    ],
    resolve: {
      tsconfigPaths: true,
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    base: './',
    build: {
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: false,
      reportCompressedSize: false,
      rolldownOptions: {
        input: {
          index: path.resolve(import.meta.dirname, 'index.html'),
        },
        output: {
          minify: {
            compress: {
              dropConsole: env.VITE_DROP_CONSOLE == '1',
              dropDebugger: env.VITE_DROP_CONSOLE == '1',
            },
          },
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              for (const key in splitDependencies) {
                if (id.includes(splitDependencies[key])) return `chunks/${key}`
              }
            }
          },
        },
        checks: {
          pluginTimings: false,
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3020,
      hmr: true,
      forwardConsole: true,
    },
    css: {
      postcss: {
        plugins: [
          legacyCssCompat(),
          ...(postcssPresetEnvPlugin ? [postcssPresetEnvPlugin] : []),
          pxtorem({
            rootValue: (root) => (path.normalize(root?.file ?? '').includes(vantPackagePath) ? 5 : 10),
            propList: ['*'],
            selectorBlackList: ['.ignore', 'pc'],
            exclude(filePath) {
              return filePath.includes('vue-sonner')
            },
            replace: true,
            minPixelValue: 0,
          }),
        ],
      },
    },
  }
})
