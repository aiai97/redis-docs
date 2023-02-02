---
home: true
title: Golang Redis client

actions:
  - text: Introduction
    link: /guide/
    type: primary
  - text: Getting started
    link: /guide/go-redis.html
    type: secondary

features:
  - title: All flavors
    details:
      Out-of-the-box works with Redis Server, Redis Cluster, Redis Sentinel, and even Ring of Redis
      Servers.
  - title: Type-safe
    details:
      go-redis provides types for most Redis commands so you can work with well-structured replies.
  - title: Feature-rich
    details:
      We support pipelines, transactions, publish/subscribe, Lua scripts, mocks, distributed locks,
      and more.

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
