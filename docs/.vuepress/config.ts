import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { path } from '@vuepress/utils'
import { viteBundler } from '@vuepress/bundler-vite'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import { searchPlugin } from '@vuepress/plugin-search'
import { sitemapPlugin } from 'vuepress-plugin-sitemap2'
import { seoPlugin } from 'vuepress-plugin-seo2'
import { redirectPlugin } from 'vuepress-plugin-redirect'

import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

import { navbar, sidebar } from './configs'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig<DefaultThemeOptions>({
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Go Redis',
      description: 'Golang Redis client for Redis Server and Redis Cluster',
    },
    '/zh/': {
      lang: 'zh-CN',
      title: 'Go Redis',
      description: '支持Redis Server和Redis Cluster的Golang客户端',
    },
  },

  theme: defaultTheme({
    logo: '/favicon-32x32.png',
    colorMode: 'light',
    colorModeSwitch: false,
    contributors: false,

    docsRepo: 'go-redis/redis-docs',
    docsBranch: 'master',
    docsDir: 'docs',

    locales: {
      '/': {
        navbar: navbar.en,
        sidebar: sidebar.en,
        editLinkText: 'Edit this page on GitHub',
      },

      '/zh/': {
        // navbar
        navbar: navbar.zh,
        selectLanguageName: '简体中文',
        selectLanguageText: '选择语言',
        selectLanguageAriaLabel: '选择语言',
        // sidebar
        sidebar: sidebar.zh,
        // page meta
        editLinkText: '在 GitHub 上编辑此页',
        lastUpdatedText: '上次更新',
        contributorsText: '贡献者',
        // custom containers
        tip: '提示',
        warning: '注意',
        danger: '警告',
        // 404 page
        notFound: [
          '这里什么都没有',
          '我们怎么到这来了？',
          '这是一个 404 页面',
          '看起来我们进入了错误的链接',
        ],
        backToHome: '返回首页',
        // a11y
        openInNewWindow: '在新窗口打开',
        toggleColorMode: '切换颜色模式',
        toggleSidebar: '切换侧边栏',
      },
    },
  }),
  alias: {
    '@': path.resolve(__dirname),
    '@public': path.resolve(__dirname, 'public'),
  },

  evergreen: !isProd,
  shouldPreload: false,
  shouldPrefetch: false,

  bundler: viteBundler({
    viteOptions: {
      plugins: [
        AutoImport({
          resolvers: [ElementPlusResolver(), IconsResolver()],
          vueTemplate: true,
        }),

        Components({
          resolvers: [
            IconsResolver({
              enabledCollections: ['ep'],
            }),
            ElementPlusResolver(),
          ],
        }),

        Icons(),
      ],
      ssr: {
        noExternal: ['element-plus'],
      },
    },
  }),

  markdown: {
    code: {
      lineNumbers: false,
    },
  },

  plugins: [
    googleAnalyticsPlugin({ id: 'G-WS7W97P9KS' }),
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, './components'),
    }),
    searchPlugin(),
    sitemapPlugin({ hostname: 'https://redis.uptrace.dev' }),
    seoPlugin({
      hostname: 'https://redis.uptrace.dev',
      canonical(page) {
        return 'https://redis.uptrace.dev' + page.path
      },
      customHead(head, page) {
        const keywords = page.frontmatter.keywords
        if (keywords) {
          head.push([
            'meta',
            {
              name: 'keywords',
              content: keywords.join(','),
            },
          ])
        }
      },
    }),
    redirectPlugin({
      hostname: 'https://redis.uptrace.dev',
      config: {
        '/cluster/index.html': '/guide/go-redis-cluster.html',
        '/sentinel/index.html': '/guide/go-redis-sentinel.html',
        '/ring/index.html': '/guide/ring.html',
        '/universal/index.html': '/guide/universal.html',
        '/tracing/index.html': '/guide/redis-performance-monitoring.html',
        '/caching/index.html': '/guide/go-redis-cache.html',
        '/rate-limiting/index.html': '/guide/go-redis-rate-limiting.html',
        '/get-all-keys/index.html': '/guide/get-all-keys.html',

        '/guide/cluster.html': '/guide/go-redis-cluster.html',
        '/guide/caching.html': '/guide/go-redis-cache.html',
        '/guide/hll.html': '/guide/go-redis-hll.html',
        '/guide/performance.html': '/guide/go-redis-debugging.html',
        '/guide/pipelines.html': '/guide/go-redis-pipelines.html',
        '/guide/pubsub.html': '/guide/go-redis-pubsub.html',
        '/guide/rate-limiting.html': '/guide/go-redis-rate-limiting.html',
        '/guide/sentinel.html': '/guide/go-redis-sentinel.html',
        '/guide/server.html': '/guide/go-redis.html',
        '/guide/tracing.html': '/guide/redis-performance-monitoring.html',
        '/guide/redis-performance-monitoring.html': '/guide/go-redis-monitoring.html',
      },
    }),
    require('./uptrace-plugin'),
  ],
})
