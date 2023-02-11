---
title: Redis Universal 通用客户端
---

<CoverImage title="Go Redis Universal 客户端" />

<!-- prettier-ignore -->
::: tip 提示
要了解如何使用 go-redis 客户端，请参阅 [入门](go-redis.html) 指南。
:::

`UniversalClient` 并不是一个客户端，而是对 `Client` 、 `ClusterClient` 、 `FailoverClient` 客户端的包装。

根据不同的选项，客户端的类型如下：
1. 如果指定了 `MasterName` 选项，则返回 `FailoverClient` 哨兵客户端。
2. 如果 `Addrs` 是2个以上的地址，则返回 `ClusterClient` 集群客户端。
3. 其他情况，返回 `Client` 单节点客户端。

示例如下，更多设置请参照 [redis.UniversalOptions](go-redis-option.html#redis-universal-client):

```go
// *redis.Client.
rdb := NewUniversalClient(&redis.UniversalOptions{
    Addrs: []string{":6379"},
})

// *redis.ClusterClient.
rdb := NewUniversalClient(&redis.UniversalOptions{
    Addrs: []string{":6379", ":6380"},
})

// *redis.FailoverClient.
rdb := NewUniversalClient(&redis.UniversalOptions{
    Addrs: []string{":6379"},
    MasterName: "mymaster",
})
```
