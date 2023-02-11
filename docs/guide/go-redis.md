---
title: Go Redis [getting started guide]
keywords: [go redis, golang redis, redis go, redis golang]
---

<CoverImage title="Getting started with Golang Redis" />

[[toc]]

## Installation

go-redis supports 2 last Go versions and only works with
[Go modules](https://github.com/golang/go/wiki/Modules). So first you need to initialize a Go
module:

```shell
go mod init github.com/my/repo
```

To install go-redis/**v9** (currently in beta):

```shell
go get github.com/redis/go-redis/v9
```

## Connecting to Redis Server

To connect to a Redis Server:

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewClient(&redis.Options{
	Addr:	  "localhost:6379",
	Password: "", // no password set
	DB:		  0,  // use default DB
})
```

Another popular way is using a connection string:

```go
opt, err := redis.ParseURL("redis://<user>:<pass>@localhost:6379/<db>")
if err != nil {
	panic(err)
}

rdb := redis.NewClient(opt)
```

### Using TLS

To enable TLS/SSL, you need to provide an empty `tls.Config`. If you're using private certs, you
need to [specify](https://pkg.go.dev/crypto/tls#example-LoadX509KeyPair) them in the `tls.Config`.

```go
rdb := redis.NewClient(&redis.Options{
	TLSConfig: &tls.Config{
		MinVersion: tls.VersionTLS12,
		//Certificates: []tls.Certificate{cert}
	},
})
```

If you are getting
`x509: cannot validate certificate for xxx.xxx.xxx.xxx because it doesn't contain any IP SANs`, try
to set `ServerName` option:

```go
rdb := redis.NewClient(&redis.Options{
	TLSConfig: &tls.Config{
		MinVersion: tls.VersionTLS12,
		ServerName: "your.domain.com",
	},
})
```

### Over SSH

To connect over SSH channel:

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
	// Disable timeouts, because SSH does not support deadlines.
	ReadTimeout:  -1,
	WriteTimeout: -1,
})
```

### dial tcp: i/o timeout

You get `dial tcp: i/o timeout` error when go-redis can't connect to the Redis Server, for example,
when the server is down or the port is protected by a firewall. To check if Redis Server is
listening on the port, run telnet command on the host where the go-redis client is running:

```shell
telnet localhost 6379
Trying 127.0.0.1...
telnet: Unable to connect to remote host: Connection refused
```

If you use Docker, Istio, or any other service mesh / sidecar, make sure the app starts after the
container is fully available, for example, by configuring
[healthchecks](https://docs.docker.com/engine/reference/run/#healthcheck) with Docker and
`holdApplicationUntilProxyStarts` with Istio.

## Context

Every Redis command accepts a context that you can use to set
[timeouts](go-redis-debugging.html#timeouts) or propagate some information, for example,
[tracing context](go-redis-monitoring.html).

```go
ctx := context.Background()
```

## Executing commands

To execute a command:

```go
val, err := rdb.Get(ctx, "key").Result()
fmt.Println(val)
```

Alternatively you can save the command and later access the value and the error separately:

```go
get := rdb.Get(ctx, "key")
fmt.Println(get.Val(), get.Err())
```

## Executing unsupported commands

To execute arbitrary/custom command:

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

`Do` returns a [Cmd](https://pkg.go.dev/github.com/redis/go-redis/v9#Cmd) that has a bunch of
helpers to work with `interface{}` value:

```go
// Text is a shortcut for get.Val().(string) with proper error handling.
val, err := rdb.Do(ctx, "get", "key").Text()
fmt.Println(val, err)
```

The full list of helpers:

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

go-redis exports the `redis.Nil` error and returns it whenever Redis Server responds with `(nil)`.
You can use redis-cli to check what response Redis returns.

In the following example we use `redis.Nil` to distinguish an empty string reply and a nil reply
(key does not exist):

```go
val, err := rdb.Get(ctx, "key").Result()
switch {
case err == redis.Nil:
	fmt.Println("key does not exist")
case err != nil:
	fmt.Println("Get failed", err)
case val == "":
	fmt.Println("value is empty")
}
```

`GET` is not the only command that returns nil reply, for example, `BLPOP` and `ZSCORE` can also
return `redis.Nil`.

## Conn

Conn represents a single Redis connection rather than a pool of connections. Prefer running commands
from Client unless there is a specific need for a continuous single Redis connection.

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

## See also

!!!include(see-also.md)!!!
