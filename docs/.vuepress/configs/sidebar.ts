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
      text: '使用文档',
      children: [
        { text: '介绍', link: '/zh/guide/' },
        { text: '入门', link: '/zh/guide/go-redis.html' },
        { text: 'Redis集群', link: '/zh/guide/go-redis-cluster.html' },
        { text: 'Redis哨兵', link: '/zh/guide/go-redis-sentinel.html' },
        { text: 'Redis分片', link: '/zh/guide/ring.html' },
        { text: '通用客户端', link: '/zh/guide/universal.html' },
        { text: '管道和事务', link: '/zh/guide/go-redis-pipelines.html' },
        { text: '发布订阅', link: '/zh/guide/go-redis-pubsub.html' },
        { text: '配置项', link: '/zh/guide/go-redis-option.html' },
      ],
    },
    {
      isGroup: true,
      text: '资料说明',
      children: [
        { text: '调试：连接池、超时', link: '/zh/guide/go-redis-debug.html' },
        { text: 'Hook钩子', link: '/zh/guide/go-redis-hook.html' },
        { text: '追踪监控', link: '/zh/guide/go-redis-monitoring.html' },
        { text: 'Lua 脚本', link: '/zh/guide/lua-scripting.html' },
        { text: '限速器', link: '/zh/guide/go-redis-rate-limiting.html' },
        { text: '迭代Key', link: '/zh/guide/get-all-keys.html' },
        { text: '结果集映射', link: '/zh/guide/scanning-hash-fields.html' },
        { text: 'HyperLogLog', link: '/zh/guide/go-redis-hll.html' },
      ],
    },
  ],
}
