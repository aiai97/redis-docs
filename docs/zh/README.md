---
home: true
title: Golang Redis客户端

actions:
  - text: 介绍
    link: /zh/guide/
    type: primary
  - text: 入门
    link: /zh/guide/go-redis.html
    type: secondary

features:
  - title: 多种客户端
    details:
      支持单机Redis Server、Redis Cluster、Redis Sentinel、Redis分片服务器
  - title: 数据类型
    details:
      go-redis会根据不同的redis命令处理成指定的数据类型，不必进行繁琐的数据类型转换
  - title: 功能完善
    details:
      go-redis支持管道(pipeline)、事务、pub/sub、Lua脚本、mock、分布式锁等功能

footer: Copyright © 2023 Go-Redis Authors
---

```go
package main

import (
	"context"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:	  "localhost:6379",
		Password: "", // no password set
		DB:		  0,  // use default DB
	})

	err := rdb.Set(ctx, "key", "value", 0).Err()
	if err != nil {
		panic(err)
	}

	val, err := rdb.Get(ctx, "key").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println("key", val)

	val2, err := rdb.Get(ctx, "key2").Result()
	if err == redis.Nil {
		fmt.Println("key2 does not exist")
	} else if err != nil {
		panic(err)
	} else {
		fmt.Println("key2", val2)
	}
	// Output: key value
	// key2 does not exist
}
```
