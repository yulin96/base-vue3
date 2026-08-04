import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { buildCheck } from './build/buildCheck.ts'

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { vitePluginDeployFtp, vitePluginDeployOss } from 'vite-plugin-upload'
import { vitePluginMetaShare } from './build/metaShare.ts'
import { vitePluginOrganizeResource } from './build/organizeResource.ts'

import tailwindcss from '@tailwindcss/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'vue-router/vite'

import pxtorem from '@minko-fe/postcss-pxtorem'
import postcssPresetEnv from 'postcss-preset-env'

const splitDependencies: Record<string, string> = {
  gsap: 'gsap',
  lottie: 'lottie-web',
  dingtalk: 'dingtalk-jsapi',
  vueuse: '@vueuse/core',
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isTestDeploy = mode === 'deploy-test'
  const isDeployMode = mode === 'deploy' || isTestDeploy
  const resolveDeployDir = (dir?: string) => {
    const normalizedDir = (dir || '').trim().replace(/\/+$/, '')
    if (!normalizedDir) return ''
    return isTestDeploy ? `${normalizedDir}/__test__` : normalizedDir
  }
  const ossRootDir = resolveDeployDir(env.VITE_OSS_ROOT_DIR)
  const ftpDir = resolveDeployDir(env.VITE_FTP_DIRNAME)

  return {
    define: {
      __ARMSEndpoint: JSON.stringify(process.env.ARMSEndpoint),
    },
    plugins: [
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
      VueRouter({
        dts: './types/route-map.d.ts',
        importMode: command === 'build' ? 'sync' : 'async',
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
      legacy({
        targets: ['chrome >= 87', 'safari >= 13'],
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
          manualChunks(id) {
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
          postcssPresetEnv({
            browsers: ['ios >= 13', 'chrome >= 87', 'safari >= 13'],
            autoprefixer: {},
            features: {
              'cascade-layers': false,
            },
          }),
          pxtorem({
            rootValue: (root) => ((root?.file ?? '').indexOf('node_modules/vant') !== -1 ? 5 : 10),
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
