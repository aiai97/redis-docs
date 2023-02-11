---
title: Go Redis [快速入门]
keywords: [go redis, golang redis, redis go, redis golang]
---

<CoverImage title="Go Redis 快速入门" />

[[toc]]

## 安装

go-redis 支持 2 个最新的 go 版本且依赖[Go modules](https://github.com/golang/go/wiki/Modules)，如果
你还没有 go mod，你需要首先初始化:

```shell
go mod init github.com/my/repo
```

安装 go-redis/**v9** (支持所有的 redis 版本):

```shell
go get github.com/redis/go-redis/v9
```

## 连接到 Redis 服务器

连接到 Redis 服务器示例，更多配置参数，请参照 [redis.Options](go-redis-option.html#redis-client):

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewClient(&redis.Options{
	Addr:	  "localhost:6379",
	Password: "", // 没有密码，默认值
	DB:		  0,  // 默认DB 0
})
```

同时也支持另外一种常见的连接字符串:

```go
opt, err := redis.ParseURL("redis://<user>:<pass>@localhost:6379/<db>")
if err != nil {
	panic(err)
}

rdb := redis.NewClient(opt)
```

### 使用 TLS

你需要手动设置 `tls.Config`，你可以在 [这里](https://pkg.go.dev/crypto/tls#example-LoadX509KeyPair)
了解相关 `tls.Config`更多的配置信息：

```go
rdb := redis.NewClient(&redis.Options{
	TLSConfig: &tls.Config{
		MinVersion: tls.VersionTLS12,
		ServerName: "you domain",
		//Certificates: []tls.Certificate{cert}
	},
})
```

如果你使用的是域名连接，且遇到了类似
`x509: cannot validate certificate for xxx.xxx.xxx.xxx because it doesn't contain any IP SANs`的错误
，应该在 ServerName 中指定你的域名：[#1710](https://github.com/redis/go-redis/discussions/1710)

```go
rdb := redis.NewClient(&redis.Options{
	TLSConfig: &tls.Config{
		MinVersion: tls.VersionTLS12,
		ServerName: "你的域名",
	},
})
```

### SSH 方式

使用 SSH 协议连接:

```go
sshConfig := &ssh.ClientConfig{
	User:			 "root",
	Auth:			 []ssh.AuthMethod{ssh.Password("password")},
	HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	Timeout:		 15 * time.Second,
}

sshClient, err := ssh.Dial("tcp", "remoteIP:22", sshConfig)
if err != nil {
	panic(err)
}

rdb := redis.NewClient(&redis.Options{
	Addr: net.JoinHostPort("127.0.0.1", "6379"),
	Dialer: func(ctx context.Context, network, addr string) (net.Conn, error) {
		return sshClient.Dial(network, addr)
	},
	// SSH不支持超时设置，在这里禁用
	ReadTimeout:  -1,
	WriteTimeout: -1,
})
```

### dial tcp: i/o timeout

当你遇到 `dial tcp: i/o timeout` 错误时，表示 go-redis 无法连接 Redis 服务器，比如 redis 服务器没有
正常运行或监听了其他端口，以及可能被防火墙拦截等。你可以使用一些网络命令排查问题，例如 `telnet`:

```shell
telnet localhost 6379
Trying 127.0.0.1...
telnet: Unable to connect to remote host: Connection refused
```

如果你使用 Docker、Kubernetes、Istio、Service Mesh、Sidecar 方式运行，应该确保服务在容器完全可用后启
动，你可以通过[健康检查](https://docs.docker.com/engine/reference/run/#healthcheck)、Readiness
Gate、Istio `holdApplicationUntilProxyStarts`等。

## Context 上下文

go-redis 支持 Context，你可以使用它控制 [超时](go-redis-debugging.html#timeouts) 或者传递一些数据,
也可以 [监控](go-redis-monitoring.html) go-redis 性能。

```go
ctx := context.Background()
```

## 执行 Redis 命令

执行 Redis 命令:

```go
val, err := rdb.Get(ctx, "key").Result()
fmt.Println(val)
```

你也可以分别访问值和错误：

```go
get := rdb.Get(ctx, "key")
fmt.Println(get.Val(), get.Err())
```

## 执行尚不支持的命令

可以使用 `Do()` 方法执行尚不支持或者任意命令:

```go
val, err := rdb.Do(ctx, "get", "key").Result()
if err != nil {
	if err == redis.Nil {
		fmt.Println("key does not exists")
		return
	}
	panic(err)
}
fmt.Println(val.(string))
```

`Do()` 方法返回 [Cmd](https://pkg.go.dev/github.com/redis/go-redis/v9#Cmd) 类型，你可以使用它获取你
想要的类型：

```go
// Text is a shortcut for get.Val().(string) with proper error handling.
val, err := rdb.Do(ctx, "get", "key").Text()
fmt.Println(val, err)
```

方法列表:

```go
s, err := cmd.Text()
flag, err := cmd.Bool()

num, err := cmd.Int()
num, err := cmd.Int64()
num, err := cmd.Uint64()
num, err := cmd.Float32()
num, err := cmd.Float64()

ss, err := cmd.StringSlice()
ns, err := cmd.Int64Slice()
ns, err := cmd.Uint64Slice()
fs, err := cmd.Float32Slice()
fs, err := cmd.Float64Slice()
bs, err := cmd.BoolSlice()
```

## redis.Nil

`redis.Nil` 是一种特殊的错误，严格意义上来说它并不是错误，而是代表一种状态，例如你使用 Get 命令获取
key 的值，当 key 不存在时，返回 `redis.Nil`。在其他比如 `BLPOP` 、 `ZSCORE` 也有类似的响应，你需要区
分错误：

```go
val, err := rdb.Get(ctx, "key").Result()
switch {
case err == redis.Nil:
	fmt.Println("key不存在")
case err != nil:
	fmt.Println("错误", err)
case val == "":
	fmt.Println("值是空字符串")
}
```

## Conn

redis.Conn 是从连接池中取出的单个连接，除非你有特殊的需要，否则尽量不要使用它。你可以使用它向 redis
发送任何数据并读取 redis 的响应，当你使用完毕时，应该把它返回给 go-redis，否则连接池会永远丢失一个连
接。

```go
cn := rdb.Conn(ctx)
defer cn.Close()

if err := cn.ClientSetName(ctx, "myclient").Err(); err != nil {
	panic(err)
}

name, err := cn.ClientGetName(ctx).Result()
if err != nil {
	panic(err)
}
fmt.Println("client name", name)
```
