---
title: Go Redis [配置]
---

<CoverImage title="Go Redis 配置" />

[[toc]]

## 限流器

```go
// Limiter 是限流或禁止请求的一个接口，需要用户自己实现
type Limiter interface {
	// Allow 方法返回一个error类型
	// 1、如果不允许则返回一个错误，go-redis会把这个错误传递到调用命令处的error，
	//    例如 rdb.Get(...).Err() 将收到 Allow() 返回的错误
	// 2、如果允许操作，返回nil，go-redis则通过 ReportResult(err) 报告此次操作的结果
	Allow() error
	
	// 如果 Allow() 允许此次操作，则会通过 ReportResult(err) 方法报告此次操作的结果
	// err为nil或具体错误
	ReportResult(result error)
}
```

## Redis Client

```go
type Options struct {
    // 连接网络类型，如: tcp、udp、unix等方式
    // 如果为空默认tcp
    Network string
	
    // redis服务器地址，ip:port格式，比如：192.168.1.100:6379
    // 默认为 :6379
    Addr string
    
    // ClientName 是对网络连接设置一个名字，使用 "CLIENT LIST" 命令
    // 可以查看redis服务器当前的网络连接列表
    // 如果设置了ClientName，go-redis对每个连接调用 `CLIENT SETNAME ClientName` 命令
    // 查看: https://redis.io/commands/client-setname/
    // 默认为空，不设置客户端名称
    ClientName string
	
    // 如果你想自定义连接网络的方式，可以自定义 `Dialer` 方法，
    // 如果不指定，将使用默认的方式进行网络连接 `redis.NewDialer`
    Dialer func(ctx context.Context, network, addr string) (net.Conn, error)
    
    // 建立了新连接时调用此函数
    // 默认为nil
    OnConnect func(ctx context.Context, cn *Conn) error
	
    // 当redis服务器版本在6.0以上时，作为ACL认证信息配合密码一起使用，
    // ACL是redis 6.0以上版本提供的认证功能，6.0以下版本仅支持密码认证。
    // 默认为空，不进行认证。
    Username string

    // 当redis服务器版本在6.0以上时，作为ACL认证信息配合密码一起使用，
    // 当redis服务器版本在6.0以下时，仅作为密码认证。
    // ACL是redis 6.0以上版本提供的认证功能，6.0以下版本仅支持密码认证。
    // 默认为空，不进行认证。
    Password string
	
    // 允许动态设置用户名和密码，go-redis在进行网络连接时会获取用户名和密码，
    // 这对一些认证鉴权有时效性的系统来说很有用，比如一些云服务商提供认证信息有效期为12小时。
    // 默认为nil
    CredentialsProvider func() (username string, password string)
    
    // redis DB 数据库，默认为0
    DB int
    
    // 命令最大重试次数， 默认为3
    MaxRetries int
	
    // 每次重试最小间隔时间
    // 默认 8 * time.Millisecond (8毫秒) ，设置-1为禁用
    MinRetryBackoff time.Duration

    // 每次重试最大间隔时间
    // 默认 512 * time.Millisecond (512毫秒) ，设置-1为禁用
    MaxRetryBackoff time.Duration
    
    // 建立新网络连接时的超时时间
    // 默认5秒
    DialTimeout time.Duration
	
    // 从网络连接中读取数据超时时间，可能的值：
    //  0 - 默认值，3秒
    // -1 - 无超时，无限期的阻塞
    // -2 - 不进行超时设置，不调用 SetReadDeadline 方法
    ReadTimeout time.Duration
	
    // 把数据写入网络连接的超时时间，可能的值：
    //  0 - 默认值，3秒
    // -1 - 无超时，无限期的阻塞
    // -2 - 不进行超时设置，不调用 SetWriteDeadline 方法
    WriteTimeout time.Duration
	
    // 是否使用context.Context的上下文截止时间，
    // 有些情况下，context.Context的超时可能带来问题。
    // 默认不使用
    ContextTimeoutEnabled bool

    // 连接池的类型，有 LIFO 和 FIFO 两种模式，
    // PoolFIFO 为 false 时使用 LIFO 模式，为 true 使用 FIFO 模式。
    // 当一个连接使用完毕时会把连接归还给连接池，连接池会把连接放入队尾，
    // LIFO 模式时，每次取空闲连接会从"队尾"取，就是刚放入队尾的空闲连接，
    // 也就是说 LIFO 每次使用的都是热连接，连接池有机会关闭"队头"的长期空闲连接，
    // 并且从概率上，刚放入的热连接健康状态会更好；
    // 而 FIFO 模式则相反，每次取空闲连接会从"队头"取，相比较于 LIFO 模式，
    // 会使整个连接池的连接使用更加平均，有点类似于负载均衡寻轮模式，会循环的使用
    // 连接池的所有连接，如果你使用 go-redis 当做代理让后端 redis 节点负载更平均的话，
    // FIFO 模式对你很有用。
    // 如果你不确定使用什么模式，请保持默认 PoolFIFO = false
    PoolFIFO bool

    // 连接池最大连接数量，注意：这里不包括 pub/sub，pub/sub 将使用独立的网络连接
    // 默认为 10 * runtime.GOMAXPROCS
    PoolSize int
	
    // PoolTimeout 代表如果连接池所有连接都在使用中，等待获取连接时间，超时将返回错误
    // 默认是 1秒+ReadTimeout
    PoolTimeout time.Duration
	
    // 连接池保持的最小空闲连接数，它受到PoolSize的限制
    // 默认为0，不保持
    MinIdleConns int
	
    // 连接池保持的最大空闲连接数，多余的空闲连接将被关闭
    // 默认为0，不限制
    MaxIdleConns int

    // ConnMaxIdleTime 是最大空闲时间，超过这个时间将被关闭。
    // 如果 ConnMaxIdleTime <= 0，则连接不会因为空闲而被关闭。
    // 默认值是30分钟，-1禁用
    ConnMaxIdleTime time.Duration

    // ConnMaxLifetime 是一个连接的生存时间，
    // 和 ConnMaxIdleTime 不同，ConnMaxLifetime 表示连接最大的存活时间
    // 如果 ConnMaxLifetime <= 0，则连接不会有使用时间限制
    // 默认值为0，代表连接没有时间限制
    ConnMaxLifetime time.Duration
    
    // 如果你的redis服务器需要TLS访问，可以在这里配置TLS证书等信息
    // 如果配置了证书信息，go-redis将使用TLS发起连接，
    // 如果你自定义了 `Dialer` 方法，你需要自己实现网络连接
    TLSConfig *tls.Config
    
    // 限流器的配置，参照 `Limiter` 接口
    Limiter Limiter
    
    // 设置启用在副本节点只读查询，默认为false不启用
    // 参照：https://redis.io/commands/readonly
    readOnly bool
}
```

## Redis Cluster Client

部分配置项继承自 `Options`，请查看 [Options](go-redis-option.html#redis-client) 说明。

```go
type ClusterOptions struct {
    // redis集群的列表地址
	// 例如：[]string{"192.168.1.10:6379", "192.168.1.11:6379"}
    Addrs []string
    
    // ClientName 和 `Options` 相同，会对集群每个Node节点的每个网络连接配置
    ClientName string
    
    // New集群节点 `*redis.Client` 的对象，
	// go-redis 默认使用 `redis.NewClient(opt)` 方法
    NewClient func(opt *Options) *Client
    
    // 同 `Options`
    MaxRedirects int
    
    // 启用从节点处理只读命令，go-redis会把只读命令发给从节点(如果有从节点)
	// 默认不启用
    ReadOnly bool
	
	// 把只读命令发送到响应最快的节点，自动启用 `ReadOnly` 选项
    RouteByLatency bool
	
    // 把只读命令随机到一个节点，自动启用 `ReadOnly` 选项
    RouteRandomly bool
	
	// 返回redis集群Slot信息的函数，go-redis默认将获取redis-cluster的配置信息
	// 如果你是自建redis集群在节点直接操作读写，需要自己配置Slot信息
	// 可以使用 `Cluster.ReloadState` 手动加载集群配置信息
    ClusterSlots func(context.Context) ([]ClusterSlot, error)
    
    // 下面的配置项，和 `Options` 基本一致，请参照 `Options` 的说明
    
    Dialer func(ctx context.Context, network, addr string) (net.Conn, error)
    
    OnConnect func(ctx context.Context, cn *Conn) error
    
    Username string
    Password string
    
    MaxRetries      int
    MinRetryBackoff time.Duration
    MaxRetryBackoff time.Duration
    
    DialTimeout           time.Duration
    ReadTimeout           time.Duration
    WriteTimeout          time.Duration
    ContextTimeoutEnabled bool
    
    PoolFIFO        bool
	
	// 连接池配置项，是针对集群中的一个节点，而不是整个集群
	// 例如你的集群有15个redis节点， `PoolSize` 代表和每个节点的连接数量
	// 最终最大连接数为 PoolSize * 15节点数量
    PoolSize        int
    PoolTimeout     time.Duration
    MinIdleConns    int
    MaxIdleConns    int
    ConnMaxIdleTime time.Duration
    ConnMaxLifetime time.Duration
    
    TLSConfig *tls.Config
}
```

## Redis Ring Client

部分配置项继承自 `Options`，请查看 [Options](go-redis-option.html#redis-client) 说明。

```go
// RingOptions are used to configure a ring client and should be
// passed to NewRing.
type RingOptions struct {
	// redis服务器地址
	// 示例："one" => "192.168.1.10:6379", "two" => "192.168.1.11:6379"
	Addrs map[string]string

	// New集群节点 `*redis.Client` 的对象，
	// go-redis 默认使用 `redis.NewClient(opt)` 方法
	NewClient func(opt *Options) *Client

    // ClientName 和 `Options` 相同，会对每个Node节点的每个网络连接配置
	ClientName string
	
	// 节点健康检查的时间间隔，默认500毫秒
	// 如果连续3次检查失败，认为节点宕机
	HeartbeatFrequency time.Duration
	
	// 设置自定义的一致性hash算法，ring会在多个节点之间通过hash算法分布key
	// 参考: https://medium.com/@dgryski/consistent-hashing-algorithmic-tradeoffs-ef6b8e2fcae8
	NewConsistentHash func(shards []string) ConsistentHash

    // 下面的配置项，和 `Options` 基本一致，请参照 `Options` 的说明

	Dialer    func(ctx context.Context, network, addr string) (net.Conn, error)
	OnConnect func(ctx context.Context, cn *Conn) error

	Username string
	Password string
	DB       int

	MaxRetries      int
	MinRetryBackoff time.Duration
	MaxRetryBackoff time.Duration

	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	PoolFIFO bool
	
    // 连接池配置项，是针对集群中的一个节点，而不是整个集群
    // 例如你的集群有15个redis节点， `PoolSize` 代表和每个节点的连接数量
    // 最终最大连接数为 PoolSize * 15节点数量
	PoolSize        int
	PoolTimeout     time.Duration
	MinIdleConns    int
	MaxIdleConns    int
	ConnMaxIdleTime time.Duration
	ConnMaxLifetime time.Duration

	TLSConfig *tls.Config
	Limiter   Limiter
}
```

## Redis Failover Client 和 Failover Cluster Client

部分配置项继承自 `Options`，请查看 [Options](go-redis-option.html#redis-client) 说明。

sentinel 配置：

```go
type FailoverOptions struct {
	// sentinel master节点名称
	MasterName string
	
	// 哨兵节点地址列表
	// 示例:[]string{"192.168.1.10:6379", "192.168.1.11:6379"}
	SentinelAddrs []string

	// ClientName 和 `Options` 相同，会对每个Node节点的每个网络连接配置
	ClientName string

	// 用于ACL认证的用户名
	SentinelUsername string

	// Sentinel中 `requirepass<password>` 的密码配置
	// 如果同时提供了 `SentinelUsername` ，则启用ACL认证
	SentinelPassword string

	// 把只读命令发送到响应最快的节点，
	// 仅限于 `Failover Cluster Client`
	RouteByLatency bool

    // 把只读命令随机到一个节点
	// 仅限于 `Failover Cluster Client`
    RouteRandomly bool

	// 把所有命令发送到发送到只读节点
	ReplicaOnly bool

	// 当所有副本节点都无法连接时，尝试使用与Sentinel已断开连接的副本
	UseDisconnectedReplicas bool

	// 下面的配置项，和 `Options` 基本一致，请参照 `Options` 的说明

	Dialer    func(ctx context.Context, network, addr string) (net.Conn, error)
	OnConnect func(ctx context.Context, cn *Conn) error

	Username string
	Password string
	DB       int

	MaxRetries      int
	MinRetryBackoff time.Duration
	MaxRetryBackoff time.Duration

	DialTimeout           time.Duration
	ReadTimeout           time.Duration
	WriteTimeout          time.Duration
	ContextTimeoutEnabled bool

	PoolFIFO bool
	
	// 连接池配置项，是针对一个节点的设置，而不是所有节点
	// 例如你的集群有15个redis节点， `PoolSize` 代表和每个节点的连接数量
	// 最终最大连接数为 PoolSize * 15节点数量
	PoolSize        int
	PoolTimeout     time.Duration
	MinIdleConns    int
	MaxIdleConns    int
	ConnMaxIdleTime time.Duration
	ConnMaxLifetime time.Duration

	TLSConfig *tls.Config
}
```

## Redis Universal Client

部分配置项继承自 `Options`，请查看 [Options](go-redis-option.html#redis-client) 说明。

```go
type UniversalOptions struct {
    // 单个主机或集群配置
	// 例如：[]string{"192.168.1.10:6379"}
	Addrs []string

	// ClientName 和 `Options` 相同，会对每个Node节点的每个网络连接配置
	ClientName string

    // 设置 DB, 只针对 `Redis Client` 和 `Failover Client`
	DB int

    // 下面的配置项，和 `Options`、`Sentinel` 基本一致，请参照 `Options` 的说明

	Dialer    func(ctx context.Context, network, addr string) (net.Conn, error)
	OnConnect func(ctx context.Context, cn *Conn) error

	Username         string
	Password         string
	SentinelUsername string
	SentinelPassword string

	MaxRetries      int
	MinRetryBackoff time.Duration
	MaxRetryBackoff time.Duration

	DialTimeout           time.Duration
	ReadTimeout           time.Duration
	WriteTimeout          time.Duration
	ContextTimeoutEnabled bool

	PoolFIFO bool
	
    // 连接池配置项，是针对一个节点的设置，而不是所有节点
    // 例如你的集群有15个redis节点， `PoolSize` 代表和每个节点的连接数量
    // 最终最大连接数为 PoolSize * 15节点数量
	PoolSize        int
	PoolTimeout     time.Duration
	MinIdleConns    int
	MaxIdleConns    int
	ConnMaxIdleTime time.Duration
	ConnMaxLifetime time.Duration

	TLSConfig *tls.Config

	// 集群配置项

	MaxRedirects   int
	ReadOnly       bool
	RouteByLatency bool
	RouteRandomly  bool
	
    // 哨兵 Master Name，仅适用于 `Failover Client`
	MasterName string
}
```
