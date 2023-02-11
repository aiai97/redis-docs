---
title: go-redis vs redigo [pros and cons in 2023]
---

<UptraceCta />

<CoverImage title="Comparing go-redis vs redigo" />

| Feature                                                   | [go-redis][1]      | [redigo][2]        |
| --------------------------------------------------------- | ------------------ | ------------------ |
| GitHub stars                                              | 15k+               | 9k+                |
| Type-safe                                                 | :heavy_check_mark: | :x:                |
| Connection pooling                                        | Automatic          | Manual             |
| Custom commands                                           | :heavy_check_mark: | :heavy_check_mark: |
| [High-level PubSub API](go-redis-pubsub.html)             | :heavy_check_mark: | :x:                |
| [Redis Sentinel client](go-redis-sentinel.html)           | :heavy_check_mark: | Using a plugin     |
| [Redis Cluster client](go-redis-cluster.html)             | :heavy_check_mark: | Using a plugin     |
| [Redis Ring](ring.html)                                   | :heavy_check_mark: | :x:                |
| [OpenTelemetry instrumentation](go-redis-monitoring.html) | :heavy_check_mark: | :x:                |

The main difference between 2 projects is that go-redis provides type-safe API for each Redis
command but redigo uses print-like API:

```go
// go-redis
timeout := time.Second
_, err := rdb.Set(ctx, "key", "value", timeout).Result()


// redigo
_, err := conn.Do("SET", "key", "value", "EX", 1)
```

That said, go-redis also supports print-like API if you need it:

```go
// go-redis print-like API
ok, err := rdb.Do(ctx, "SET" "key", "value", "EX", 1).Bool()
```

Also, go-redis automatically uses connection pooling but redigo requires explicit connection
management:

```go
// go-redis implicitly uses connection pooling
_, err := rdb.Set(...).Result()

// redigo requires explicit connection management
conn := pool.Get()
_, err := conn.Do(...)
conn.Close()
```

But if you need to manage connections manually, go-redis allows you to do that as well:

```go
// go-redis manual connection management
conn := rdb.Conn(ctx)
_, err := conn.Set(...).Result()
conn.Close()
```

[1]: https://github.com/redis/go-redis
[2]: https://github.com/gomodule/redigo
