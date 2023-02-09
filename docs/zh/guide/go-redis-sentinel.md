---
title: Redis Sentinel 哨兵
---

<CoverImage title="Go Redis Sentinel 客户端" />

<!-- prettier-ignore -->
::: tip 提示
要了解如何使用 go-redis 客户端，请参阅 [入门](go-redis.html) 指南。
:::

## 服务器客户端

连接到 [哨兵模式](https://redis.io/topics/sentinel) 管理的服务器，
更多配置项，请参照 [redis.FailoverOptions](go-redis-option.html#redis-failover-client-和-failover-cluster-client):

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewFailoverClient(&redis.FailoverOptions{
    MasterName:    "master-name",
    SentinelAddrs: []string{":9126", ":9127", ":9128"},
})
```

从go-redis v8版本开始，你可以尝试使用 `NewFailoverClusterClient` 把只读命令路由到从节点，
请注意， `NewFailoverClusterClient` 借助了 `Cluster Client` 实现，不支持DB选项（只能操作DB 0）：

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewFailoverClusterClient(&redis.FailoverOptions{
    MasterName:    "master-name",
    SentinelAddrs: []string{":9126", ":9127", ":9128"},

    // 你可以选择把只读命令路由到最近的节点，或者随机节点，二选一
    // RouteByLatency: true,
    // RouteRandomly: true,
})
```

## 哨兵服务器客户端

请注意，哨兵客户端本身用于连接哨兵服务器，你可以从哨兵上获取管理的redis服务器信息：

```go
import "github.com/redis/go-redis/v9"

sentinel := redis.NewSentinelClient(&redis.Options{
    Addr: ":9126",
})

addr, err := sentinel.GetMasterAddrByName(ctx, "master-name").Result()
```
