---
title: Go client for Redis Cluster
---

<CoverImage title="Go client for Redis Cluster" />

<!-- prettier-ignore -->
::: tip
To get an idea how to use go-redis client, see [Getting started](go-redis.html) guide.
:::

go-redis comes with a client for [Redis Cluster](https://redis.io/topics/cluster-tutorial).
Underneath, `redis.ClusterClient` uses `redis.Client` to comminucate with each node in a cluster.
Each `redis.Client` maintains a separate pool of connections.

To connect to a Redis Cluster:

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{":7000", ":7001", ":7002", ":7003", ":7004", ":7005"},

    // To route commands by latency or randomly, enable one of the following.
    //RouteByLatency: true,
    //RouteRandomly: true,
})
```

To iterate over shards:

```go
err := rdb.ForEachShard(ctx, func(ctx context.Context, shard *redis.Client) error {
    return shard.Ping(ctx).Err()
})
if err != nil {
    panic(err)
}
```

To iterate over master nodes, use `ForEachMaster`. To iterate over slave nodes, use `ForEachSlave`.

To change options for some shard:

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

## See also

!!!include(see-also.md)!!!
