---
title: 'Redis: HyperLogLog [full guide 2023]'
---

<CoverImage title="Go Redis HyperLogLog" />

HyperLogLog 是用来做基数统计的算法，它提供不精确去重计数方案，标准误差是0.81%。
常用命令如下：

- [PFADD](https://redis.io/commands/pfadd) 将元素添加到集合中。
- [PFCOUNT](https://redis.io/commands/pfcount) 返回计算出的数量。

这里查看 [示例](https://github.com/redis/go-redis/tree/master/example/hll):

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
