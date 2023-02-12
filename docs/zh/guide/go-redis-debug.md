---
title: Go Redis 调试
---

<CoverImage title="Go Redis 调试" />

[[toc]]

## 连接池大小

go-redis底层维护了一个连接池，不需要手动管理。
默认情况下， go-redis 连接池大小为 `runtime.GOMAXPROCS * 10`，
在大多数情况下默认值已经足够使用，且设置太大的连接池几乎没有什么用，
可以在 [配置项](go-redis-option.html#redis-client) 中调整连接池数量：

```go
rdb := redis.NewClient(&redis.Options{
    PoolSize: 1000,
})
```

这里介绍一下连接池的配置（连接池配置全部继承自 [配置项](go-redis-option.html#redis-client) ）：
```go
type Options struct {
	// 创建网络连接时调用的函数
    Dialer  func(context.Context) (net.Conn, error)
    
	// 连接池模式，FIFO和LIFO模式
    PoolFIFO        bool
	
	// 连接池大小
    PoolSize        int
	
	// 从连接池获取连接超时时间（如果所有连接都繁忙，等待的时间）
    PoolTimeout     time.Duration
	
	// 最小空闲连接数，受PoolSize限制
    MinIdleConns    int
	
	// 最大空闲连接数，多余会被关闭
    MaxIdleConns    int
	
	// 每个连接最大空闲时间，如果超过了这个时间会被关闭
    ConnMaxIdleTime time.Duration
	
	// 连接最大生命周期
    ConnMaxLifetime time.Duration
}
```

连接池的结构：

```go
type ConnPool struct {
	// 配置项信息
	cfg *Options

	// 创建网络连接错误次数
	// 如果超过了 `Options.PoolSize` 次，再创建新连接时，会直接返回 `lastDialError` 错误，
	// 同时会进行间隔1秒的探活操作，如果探活成功，会把 `dialErrorsNum` 重新设置为0
	dialErrorsNum uint32 // atomic
	
	// 用于记录最后一次创建新连接的错误信息
	lastDialError atomic.Value

	// 长度为 `Options.PoolSize` 的chan
	// 从连接池获取连接时向chan放入一个数据，返还连接时从chan中取出一个数据
	// 如果chan已满，则证明连接池所有连接已经都被使用，需要等待
	queue chan struct{}

	// 连接池并发安全锁
	connsMu   sync.Mutex
	
	// 所有连接列表
	conns     []*Conn
	
	// 空闲连接
	idleConns []*Conn

	// 当前连接池大小，最大为 `Options.PoolSize`
	poolSize     int
	
	// 空闲连接长度
	idleConnsLen int

	// 统计状态的
	stats Stats

	// 连接池是否被关闭的 atomic 值，1-被关闭
	_closed  uint32 // atomic
}
```

### 连接池超时错误：redis: connection pool timeout

当连接池中没有空闲连接时，可能因为超过了 `Options.PoolTimeout` 时间而收到此错误，
如果你在使用 [Pub/Sub](go-redis-pubsub.html) 或 `redis.Conn`，
请确保不再使用它们时正确释放 `PubSub/Conn` 占用的网络资源。

当 Redis 处理命令的速度太慢并且池中的所有连接被阻塞的时间超过 `PoolTimeout` 持续时间时，也可能会遇到该错误。

## 超时

如果你使用 `context.Context` 处理超时，但也不要禁用 `DialTimeout` 、`ReadTimeout` 和 `WriteTimeout` ，
因为 go-redis 会在不使用 `context.Context` 的情况下执行一些后台检查，这些检查依赖这些超时配置项。

请注意：`net.Conn` 依赖 `Deadline` 而不是 `ctx` 。

`context.Context` 的超时时间不要设置太短，因为当 `context.Context`超时，
连接池无法确认连接是否还能正常使用，后面可能还会接收到数据，这样的连接不能被复用，只能丢弃并打开新的网络连接。
在网络出现缓慢、丢包、redis服务器执行消耗过多时间时， 将出现大量连接被丢弃、新建连接，这样连接池也就失去了意义，
且情况会越来越恶化。

你可以查看 [Go Context timeouts can be harmful](https://uptrace.dev/blog/golang-context-timeout.html) 
(英文版) 这篇文章了解更多。

`context` 是一种控制超时的方式，但并不是所有场景都适用它。

## 大量的连接

在高负载下一些命令会超时，go-redis 会关闭这样的连接，因为它们后面还能接收到一些数据，不能被复用。
关闭的连接会进入 `TIME_WAIT` 状态，通常是一分钟左右，你可以查看它：
```shell
cat /proc/sys/net/ipv4/tcp_fin_timeout
60
```

你可以增加读/写超时或升级您的服务器以处理更多流量，还可以增加打开连接的最大数量，
但这样做仅仅是改善这个情况，对改善性能或网络效率没什么用。

这里有 [处理 TCP TIME-WAIT](https://vincent.bernat.ch/en/blog/2014-tcp-time-wait-state-linux#summary) 的一些建议。


## 管道

go-redis大部分时间都在等待网络写入/读取的操作，因此你可以使用 [pipelines](/zh/guide/go-redis-pipelines.html)
一次发送/读取多个命令来提高性能。

## 缓存

除了 [pipelines](/zh/guide/go-redis-pipelines.html)，你也可以考虑使用 [本地缓存](/zh/guide/go-redis-cache.html) 来提高性能，
参考 `TinyLFU`。

## 硬件

应该确保服务器有良好的网络和高速缓存的 CPU。如果你有多个 CPU 内核，请考虑在单个服务器上运行多个 Redis 实例。

请参见 [影响 redis 性能的因素](https://redis.io/topics/benchmarks#factors-impacting-redis-performance) 更多细节。



