---
title: Redis Ring
---

<CoverImage title="Redis Ring" />

<!-- prettier-ignore -->
::: tip
To get an idea how to use go-redis client, see [Getting started](go-redis.html) guide.
:::

[[toc]]

## Introduction

Ring is a Redis client that uses consistent hashing to distribute keys across multiple Redis servers
(shards). It's safe for concurrent use by multiple goroutines.

Ring monitors the state of each shard and removes dead shards from the ring. When a shard comes
online, it is added back to the ring. This enables maximum availability and partition tolerance, but
no consistency between different shards or even clients. Each client uses the shards that are
available to the client and does not do any coordination with other clients when shard state is
changed.

Ring should be used when you need multiple Redis servers for caching and can tolerate losing data
when one of the servers dies. Otherwise you should use [Redis Cluster](go-redis-cluster.html) or
[Redis Server](go-redis.html).

## Quickstart

To create a Ring cluster that consists of 3 shards:

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewRing(&redis.RingOptions{
    Addrs: map[string]string{
        // shardName => host:port
        "shard1": "localhost:7000",
        "shard2": "localhost:7001",
        "shard3": "localhost:7002",
    },
})
```

Then the client can be used as usually:

```go
if err := rdb.Set(ctx, "foo", "bar", 0).Err(); err != nil {
    panic(err)
}
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

## Per shard options

To change shard connection options:

```go
rdb := redis.NewRing(&redis.RingOptions{
    NewClient: func(opt *redis.Options) *redis.NewClient {
        user, pass := userPassForAddr(opt.Addr)
        opt.Username = user
        opt.Password = pass

        return redis.NewClient(opt)
    },
})
```

## Keys distribution

By default Ring uses
[Rendezvous](https://medium.com/@dgryski/consistent-hashing-algorithmic-tradeoffs-ef6b8e2fcae8) hash
to distribute keys over multiple shards. But you can change the default consistent hash
implementation:

```go
import "github.com/golang/groupcache/consistenthash"

ring := redis.NewRing(&redis.RingOptions{
    NewConsistentHash: func() {
        return consistenthash.New(100, crc32.ChecksumIEEE)
    },
})
```

## See also

!!!include(see-also.md)!!!
