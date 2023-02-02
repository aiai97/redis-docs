---
title: Golang Redis Pipelines, WATCH, and Transactions
---

<CoverImage title="Golang Redis Pipelines, WATCH, and Transactions" />

Redis pipelines allow to improve performance by executing multiple commands using a single
client-server-client round trip. Instead of executing 100 commands one by one, you can queue the
commands in a pipeline and then execute the queued commands using a single write + read operation as
if it is a single command.

[[toc]]

## Pipelines

To execute multiple commands with a single write + read operation:

```go
pipe := rdb.Pipeline()

incr := pipe.Incr(ctx, "pipeline_counter")
pipe.Expire(ctx, "pipeline_counter", time.Hour)

cmds, err := pipe.Exec(ctx)
if err != nil {
	panic(err)
}

// The value is available only after Exec is called.
fmt.Println(incr.Val())
```

Alternatively, you can use `Pipelined` which calls `Exec` when the function exits:

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

// The value is available only after the pipeline is executed.
fmt.Println(incr.Val())
```

Pipelines also return the executed commands so can iterate over them to retrieve results:

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

## Watch

Using Redis [transactions](https://redis.io/topics/transactions), you can watch for changes in keys
and execute the pipeline only if the watched keys have not changed by another client. Such conflict
resolution method is also known as
[optimistic locking](https://en.wikipedia.org/wiki/Optimistic_concurrency_control).

```shell
WATCH mykey

val = GET mykey
val = val + 1

MULTI
SET mykey $val
EXEC
```

## Transactions

You can wrap a pipeline with MULTI and EXEC commands using `TxPipelined` and `TxPipeline`, but it is
not very useful on its own:

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

Instead, you should transactional pipelines with
[Watch](https://pkg.go.dev/github.com/redis/go-redis/v9#Client.Watch), for example, we can correctly
implement [INCR](https://redis.io/commands/INCR) command using `GET`, `SET`, and `WATCH`. Note how
we use `redis.TxFailedErr` to check if the transaction has failed or not.

```go
// Redis transactions use optimistic locking.
const maxRetries = 1000

// Increment transactionally increments the key using GET and SET commands.
func increment(key string) error {
	// Transactional function.
	txf := func(tx *redis.Tx) error {
		// Get the current value or zero.
		n, err := tx.Get(ctx, key).Int()
		if err != nil && err != redis.Nil {
			return err
		}

		// Actual operation (local in optimistic lock).
		n++

		// Operation is commited only if the watched keys remain unchanged.
		_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
			pipe.Set(ctx, key, n, 0)
			return nil
		})
		return err
	}

    // Retry if the key has been changed.
	for i := 0; i < maxRetries; i++ {
		err := rdb.Watch(ctx, txf, key)
		if err == nil {
			// Success.
			return nil
		}
		if err == redis.TxFailedErr {
			// Optimistic lock lost. Retry.
			continue
		}
		// Return any other error.
		return err
	}

	return errors.New("increment reached maximum number of retries")
}
```

## Monitoring Performance

!!!include(uptrace.md)!!!
