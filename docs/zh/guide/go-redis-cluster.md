---
title: Redis Cluster 集群
---

<CoverImage title="Go Redis Cluster 客户端" />

<!-- prettier-ignore -->
::: tip 提示
要了解如何使用 go-redis 客户端，请参阅 [入门](go-redis.html) 指南。
:::

go-redis 支持 [Redis Cluster](https://redis.io/topics/cluster-tutorial) 客户端，
如下面示例，`redis.ClusterClient` 表示集群对象，对集群内每个redis节点使用 `redis.Client` 对象进行通信，每个 `redis.Client` 会拥有单独的连接池。

连接到redis集群示例，更多配置参数，请参照 [redis.ClusterOptions](go-redis-option.html#redis-cluster-client):

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{":7000", ":7001", ":7002", ":7003", ":7004", ":7005"},
})
```

遍历每个节点：

```go
err := rdb.ForEachShard(ctx, func(ctx context.Context, shard *redis.Client) error {
    return shard.Ping(ctx).Err()
})
if err != nil {
    panic(err)
}
```

只遍历主节点请使用： `ForEachMaster`， 只遍历从节点请使用： `ForEachSlave`

你也可以自定义的设置每个节点的初始化:

```go
rdb := redis.NewClusterClient(&redis.ClusterOptions{
    NewClient: func(opt *redis.Options) *redis.NewClient {
        user, pass := userPassForAddr(opt.Addr)
        opt.Username = user
        opt.Password = pass

        return redis.NewClient(opt)
    },
})
```
