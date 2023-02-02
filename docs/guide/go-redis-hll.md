---
title: 'Redis: HyperLogLog [full guide 2023]'
---

<CoverImage title="Using HyperLogLog with go-redis" />

HyperLogLog is a data structure that you can use to count approximate number of distinct elements in
a set. Redis supports HyperLogLog via 2 commands:

- [PFADD](https://redis.io/commands/pfadd) adds elements to a set.
- [PFCOUNT](https://redis.io/commands/pfcount) returns the approximate number of distinct elements
  or, in other words, the approximated set cardinality.

For [example](https://github.com/redis/go-redis/tree/master/example/hll):

```go
package main

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr: ":6379",
	})
	_ = rdb.FlushDB(ctx).Err()

	for i := 0; i < 10; i++ {
		if err := rdb.PFAdd(ctx, "myset", fmt.Sprint(i)).Err(); err != nil {
			panic(err)
		}
	}

	card, err := rdb.PFCount(ctx, "myset").Result()
	if err != nil {
		panic(err)
	}

	fmt.Println("set cardinality", card)
}
```
