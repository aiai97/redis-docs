import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/': [
    {
      isGroup: true,
      text: 'Guide',
      children: [
        { text: 'Introduction', link: '/guide/' },
        { text: 'Getting started', link: '/guide/go-redis.html' },
        { text: 'Redis Cluster', link: '/guide/go-redis-cluster.html' },
        { text: 'Redis Sentinel', link: '/guide/go-redis-sentinel.html' },
        { text: 'Redis Ring', link: '/guide/ring.html' },
        { text: 'Universal client', link: '/guide/universal.html' },
        { text: 'Pipelines and transactions', link: '/guide/go-redis-pipelines.html' },
        { text: 'PubSub', link: '/guide/go-redis-pubsub.html' },
      ],
    },
    {
      isGroup: true,
      text: 'Tutorial',
      children: [
        { text: 'Debugging: pool size, timeouts', link: '/guide/go-redis-debugging.html' },
        { text: 'Monitoring performance and errors', link: '/guide/go-redis-monitoring.html' },
        { text: 'Redis Cache', link: '/guide/go-redis-cache.html' },
        { text: 'Lua scripting', link: '/guide/lua-scripting.html' },
        { text: 'Rate-limiting', link: '/guide/go-redis-rate-limiting.html' },
        { text: 'Get all keys', link: '/guide/get-all-keys.html' },
        { text: 'Scanning hash fields into a struct', link: '/guide/scanning-hash-fields.html' },
        {
          text: 'Bloom, Cuckoo, Count-Min, Top-K',
          link: '/guide/bloom-cuckoo-count-min-top-k.html',
        },
        { text: 'HyperLogLog', link: '/guide/go-redis-hll.html' },
        { text: 'go-redis vs redigo', link: '/guide/go-redis-vs-redigo.html' },
      ],
    },
  ],
}

export const zh: SidebarConfig = {
  '/': [
    {
      isGroup: true,
      text: 'Guide',
      children: [
        { text: '介绍', link: '/guide/' },
        { text: 'Getting started', link: '/guide/go-redis.html' },
        { text: 'Redis Cluster', link: '/guide/go-redis-cluster.html' },
        { text: 'Redis Sentinel', link: '/guide/go-redis-sentinel.html' },
        { text: 'Redis Ring', link: '/guide/ring.html' },
        { text: 'Universal client', link: '/guide/universal.html' },
        { text: 'Pipelines and transactions', link: '/guide/go-redis-pipelines.html' },
        { text: 'PubSub', link: '/guide/go-redis-pubsub.html' },
      ],
    },
    {
      isGroup: true,
      text: 'Tutorial',
      children: [
        { text: 'Debugging: pool size, timeouts', link: '/guide/go-redis-debugging.html' },
        { text: 'Monitoring performance and errors', link: '/guide/go-redis-monitoring.html' },
        { text: 'Redis Cache', link: '/guide/go-redis-cache.html' },
        { text: 'Lua scripting', link: '/guide/lua-scripting.html' },
        { text: 'Rate-limiting', link: '/guide/go-redis-rate-limiting.html' },
        { text: 'Get all keys', link: '/guide/get-all-keys.html' },
        { text: 'Scanning hash fields into a struct', link: '/guide/scanning-hash-fields.html' },
        {
          text: 'Bloom, Cuckoo, Count-Min, Top-K',
          link: '/guide/bloom-cuckoo-count-min-top-k.html',
        },
        { text: 'HyperLogLog', link: '/guide/go-redis-hll.html' },
        { text: 'go-redis vs redigo', link: '/guide/go-redis-vs-redigo.html' },
      ],
    },
  ],
}
