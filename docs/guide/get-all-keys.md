---
title: 'Redis: Get all keys with prefix [with examples]'
keywords: [redis get all keys with prefix]
---

<UptraceCta />

<CoverImage title="Redis: get/scan/iterate all keys" />

[[toc]]

## Iterating over keys

You could use `KEYS prefix:*` command to get all keys by prefix, but it is rather slow if you need
to scan millions of keys.

Instead, you can iterate over Redis keys that match some pattern using the
[SCAN](https://redis.io/commands/scan) command:

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

	if cursor == 0 { // no more keys
		break
	}
}
```

go-redis allows to simplify the code above to:

```go
iter := rdb.Scan(ctx, 0, "prefix:*", 0).Iterator()
for iter.Next(ctx) {
	fmt.Println("keys", iter.Val())
}
if err := iter.Err(); err != nil {
	panic(err)
}
```

## Sets and hashes

You can also iterate over set elements:

```go
iter := rdb.SScan(ctx, "set-key", 0, "prefix:*", 0).Iterator()
```

And hashes:

```go
iter := rdb.HScan(ctx, "hash-key", 0, "prefix:*", 0).Iterator()
iter := rdb.ZScan(ctx, "sorted-hash-key", 0, "prefix:*", 0).Iterator()
```

## Cluster and Ring

If you are using [Redis Cluster](cluster.md) or [Redis Ring](ring.md), you need to scan each cluster
node separately:

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

## Delete keys without TTL

You can also use `SCAN` to delete keys without a TTL:

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

For a more efficient version that uses pipelines see the
[example](https://github.com/redis/go-redis/tree/master/example/del-keys-without-ttl).

## Monitoring Performance

!!!include(uptrace.md)!!!
