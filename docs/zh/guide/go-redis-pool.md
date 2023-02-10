---
title: Go Redis Pool 连接池
---

<CoverImage title="Go Redis Pool 连接池" />

[[toc]]

## 介绍

go-redis底层维护了一个连接池，不需要手动管理。

连接池配置信息包含在 [配置项](go-redis-option.html#redis-client) 中，
这里介绍一下连接池的配置：
```go
type Options struct {
	// 创建网络连接时调用的函数
    Dialer  func(context.Context) (net.Conn, error)
	
	// 当连接被关闭时调用的函数，没有被使用
    OnClose func(*Conn) error
    
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
	
	// 连接池被关闭的chan，当连接时被关闭时，
	// 会执行 close(closedCh), 监听此信号的goroutine都会收到关闭消息
	closedCh chan struct{}
}
```

## 连接池工作示例图

![img.png](/img/pool_get.png)

## 超时

连接池监听 `context.Done()` 以及 `Options.PoolTimeout` 超时时间，
其中 `context` 需要在 [配置项](go-redis-option.html#redis-client) 中启用 `ContextTimeoutEnabled`。

如果超过了 `Options.PoolTimeout` 时间，连接池会返回 `ErrPoolTimeout` 超时错误。

如果你启用了 `ContextTimeoutEnabled`，但也不要依赖 `context.Context` 的超时时间，
因为go `net.Conn` 依赖 `Deadline` 而不是 `ctx` 处理超时，你依然要设置 `DialTimeout` 和 `ReadTimeout` 以及 `WriteTimeout`。

`context.Context` 的超时时间，也不要设置过短，因为当 `context.Context`超时，
连接池无法确认连接是否还能正常使用，后面可能还会接收到数据，这样的连接不能被复用，只能丢弃并打开新的网络连接。
在网络出现缓慢、丢包、redis服务器执行消耗过多时间时， 将出现大量连接被丢弃、新建连接，这样连接池也就失去了意义，
且情况会越来越恶化。

关闭的连接会进入 `TIME_WAIT` 状态，通常是一分钟左右，你可以查看它：
```shell
cat /proc/sys/net/ipv4/tcp_fin_timeout
60
```

这里有 [处理 TCP TIME-WAIT](https://vincent.bernat.ch/en/blog/2014-tcp-time-wait-state-linux#summary) 的一些建议。

`context` 是一种控制超时的方式，但并不是所有场景都适用它。

## 管道

go-redis大部分时间都在等待网络写入/读取的操作，因此你可以使用 [pipelines](/guide/go-redis-pipelines.html)
一次发送/读取多个命令来提高性能。

## 缓存

你也可以考虑使用本地缓存来提高性能，例如 [cache](/guide/go-redis-cache.html)，
你可以把热key放入cache结果内。
