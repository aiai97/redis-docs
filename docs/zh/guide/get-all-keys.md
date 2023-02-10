---
title: Go Redis 扫描所有Key
keywords: [redis get all keys with prefix]
---

<CoverImage title="Go Redis 扫描所有Key" />

[[toc]]

## 遍历Key

使用 `KEYS prefix:*` 命令可以遍历前缀为prefix的所有key，但如果redis中有上百万或更多的key，会变得非常慢。

go-redis提供了 [SCAN](https://redis.io/commands/scan) 来迭代遍历前缀为prefix的key：

```go
var cursor uint64
for {
	var keys []string
	var err error
	keys, cursor, err = rdb.Scan(ctx, cursor, "prefix:*", 0).Result()
	if err != nil {
		panic(err)
	}

	for _, key := range keys {
		fmt.Println("key", key)
	}

	// 没有更多key了
	if cursor == 0 {
		break
	}
}
```

上面的代码也可以简化成:

```go
iter := rdb.Scan(ctx, 0, "prefix:*", 0).Iterator()
for iter.Next(ctx) {
	fmt.Println("keys", iter.Val())
}
if err := iter.Err(); err != nil {
	panic(err)
}
```

## 集合和哈希类型

你可以使用 `iterate` 来迭代redis集合:

```go
iter := rdb.SScan(ctx, "set-key", 0, "prefix:*", 0).Iterator()
```

哈希类型:

```go
iter := rdb.HScan(ctx, "hash-key", 0, "prefix:*", 0).Iterator()
iter := rdb.ZScan(ctx, "sorted-hash-key", 0, "prefix:*", 0).Iterator()
```

## Cluster 和 Ring

如果你使用的是 [Redis Cluster](cluster.md) 或 [Redis Ring](ring.md)，需要分别扫描集群每个节点：

```go
err := rdb.ForEachMaster(ctx, func(ctx context.Context, rdb *redis.Client) error {
	iter := rdb.Scan(ctx, 0, "prefix:*", 0).Iterator()

	...

	return iter.Err()
})
if err != nil {
	panic(err)
}
```

## 删除无过期时间的Key

你可以使用 `SCAN` 删除没有 TTL 的key:

```go
iter := rdb.Scan(ctx, 0, "", 0).Iterator()

for iter.Next(ctx) {
	key := iter.Val()

    d, err := rdb.TTL(ctx, key).Result()
    if err != nil {
        panic(err)
    }

    if d == -1 { // -1 means no TTL
        if err := rdb.Del(ctx, key).Err(); err != nil {
            panic(err)
        }
    }
}

if err := iter.Err(); err != nil {
	panic(err)
}
```

你也可以使用管道提高效率，请参见 [示例](https://github.com/redis/go-redis/tree/master/example/del-keys-without-ttl)
