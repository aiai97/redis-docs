---
title: Golang client for Redis Sentinel
---

<CoverImage title="Golang client for Redis Sentinel" />

<!-- prettier-ignore -->
::: tip
To get an idea how to use go-redis client, see [Getting started](go-redis.html) guide.
:::

## Redis Server client

To connect to a Redis Server managed by a [Redis Sentinel](https://redis.io/topics/sentinel):

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewFailoverClient(&redis.FailoverOptions{
    MasterName:    "master-name",
    SentinelAddrs: []string{":9126", ":9127", ":9128"},
})
```

Starting from v8 you can use experimental `NewFailoverClusterClient` to route readonly commands to
slave nodes:

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewFailoverClusterClient(&redis.FailoverOptions{
    MasterName:    "master-name",
    SentinelAddrs: []string{":9126", ":9127", ":9128"},

    // To route commands by latency or randomly, enable one of the following.
    //RouteByLatency: true,
    //RouteRandomly: true,
})
```

## Redis Sentinel client

To connect to a Redis Sentinel itself:

```go
import "github.com/redis/go-redis/v9"

sentinel := redis.NewSentinelClient(&redis.Options{
    Addr: ":9126",
})

addr, err := sentinel.GetMasterAddrByName(ctx, "master-name").Result()
```
