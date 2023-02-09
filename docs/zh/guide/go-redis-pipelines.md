---
title: Redis 管道事务
---

<CoverImage title="Go Redis 管道和事务" />

Redis pipelines(管道) 允许一次性发送多个命令来提高性能，go-redis支持同样的操作，
你可以使用go-redis一次性发送多个命令到服务器，并一次读取返回结果，而不是一个个命令的操作。

请注意：在go-redis v8版本中，管道操作是并发安全的，在v9版本中并发不再安全。
我们更改的初衷来自这里 [#2351](https://github.com/redis/go-redis/discussions/2351)，
是发现在大多数用户使用时，并不要求管道的并发安全，而是顺序单线程写入，
v8版本为此付出了大量的锁操作，所以我们在v9中移除了锁。
如果你需要并发安全，请参照 [#2415](https://github.com/redis/go-redis/issues/2415) 。

[[toc]]

## 管道

通过 `go-redis Pipeline` 一次执行多个命令并读取返回值:

```go
pipe := rdb.Pipeline()

incr := pipe.Incr(ctx, "pipeline_counter")
pipe.Expire(ctx, "pipeline_counter", time.Hour)

cmds, err := pipe.Exec(ctx)
if err != nil {
	panic(err)
}

// 结果你需要再调用 Exec 后才可以使用
fmt.Println(incr.Val())
```

或者你也可以使用 `Pipelined` 方法，它将自动调用 Exec:

```go
var incr *redis.IntCmd

cmds, err := rdb.Pipelined(ctx, func(pipe redis.Pipeliner) error {
	incr = pipe.Incr(ctx, "pipelined_counter")
	pipe.Expire(ctx, "pipelined_counter", time.Hour)
	return nil
})
if err != nil {
	panic(err)
}

fmt.Println(incr.Val())
```

同时会返回每个命令的结果，你可以遍历结果集：

```go
cmds, err := rdb.Pipelined(ctx, func(pipe redis.Pipeliner) error {
	for i := 0; i < 100; i++ {
		pipe.Get(ctx, fmt.Sprintf("key%d", i))
	}
	return nil
})
if err != nil {
	panic(err)
}

for _, cmd := range cmds {
    fmt.Println(cmd.(*redis.StringCmd).Val())
}
```

## Watch 监听

使用 [Redis 事务](https://redis.io/topics/transactions)， 监听key的状态，仅当key未被其他客户端修改才会执行命令，
这种方式也被成为 [乐观锁](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)。

```shell
WATCH mykey

val = GET mykey
val = val + 1

MULTI
SET mykey $val
EXEC
```

## 事务

你可以使用 `TxPipelined` 和 `TxPipeline` 方法，把命令包装在 `MULTI` 、 `EXEC` 中，
但这种做法没什么意义：

```go
cmds, err := rdb.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
	for i := 0; i < 100; i++ {
		pipe.Get(ctx, fmt.Sprintf("key%d", i))
	}
	return nil
})
if err != nil {
	panic(err)
}

// MULTI
// GET key0
// GET key1
// ...
// GET key99
// EXEC
```

你应该正确的使用 [Watch](https://pkg.go.dev/github.com/redis/go-redis/v9#Client.Watch) + 事务管道，
比如以下示例，我们使用 `GET`, `SET` 和 `WATCH` 命令，来实现 `INCR` 操作，
注意示例中使用 `redis.TxFailedErr` 来判断失败：

```go
const maxRetries = 1000

// increment 方法，使用 GET + SET + WATCH 来实现Key递增效果，类似命令 INCR
func increment(key string) error {
	// 事务函数
	txf := func(tx *redis.Tx) error {
		n, err := tx.Get(ctx, key).Int()
		if err != nil && err != redis.Nil {
			return err
		}

		n++

		_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
			pipe.Set(ctx, key, n, 0)
			return nil
		})
		return err
	}
	
	for i := 0; i < maxRetries; i++ {
		err := rdb.Watch(ctx, txf, key)
		if err == nil {
			// Success.
			return nil
		}
		if err == redis.TxFailedErr {
			// 乐观锁失败
			continue
		}
		return err
	}

	return errors.New("increment reached maximum number of retries")
}
```
