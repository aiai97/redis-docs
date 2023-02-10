---
title: Go redis 限速器
---

<CoverImage title="Go redis 限速器" />

[go-redis/redis_rate](https://github.com/go-redis/redis_rate) 库实现了一个漏桶调度算法（又名通用信元速率算法）。

如下安装：

```shell
go get github.com/redis/go-redis_rate/v9
```

redis_rate 支持所有类型的 go-redis 客户端。

```go
rdb := redis.NewClient(&redis.Options{
    Addr: "localhost:6379",
})


limiter := redis_rate.NewLimiter(rdb)
res, err := limiter.Allow(ctx, "project:123", redis_rate.PerSecond(10))
if err != nil {
    panic(err)
}

fmt.Println("allowed", res.Allowed, "remaining", res.Remaining)
```

以下示例演示如何在 [bunrouter](https://github.com/uptrace/bunrouter/tree/master/example/rate-limiting) 
中使用redis_rate用于 HTTP 速率限制的中间件：

```go
func rateLimit(next bunrouter.HandlerFunc) bunrouter.HandlerFunc {
    return func(w http.ResponseWriter, req bunrouter.Request) error {
        res, err := limiter.Allow(req.Context(), "project:123", redis_rate.PerMinute(10))
        if err != nil {
            return err
        }

        h := w.Header()
        h.Set("RateLimit-Remaining", strconv.Itoa(res.Remaining))

        if res.Allowed == 0 {
            // We are rate limited.

            seconds := int(res.RetryAfter / time.Second)
            h.Set("RateLimit-RetryAfter", strconv.Itoa(seconds))

            // Stop processing and return the error.
            return ErrRateLimited
        }

        // Continue processing as normal.
        return next(w, req)
    }
}
```
