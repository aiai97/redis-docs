---
title: 'Redis: Bloom, Cuckoo, Count-Min, Top-K'
---

<UptraceCta />

<CoverImage title="Redis: Bloom, Cuckoo, Count-Min, Top-K" />

[[toc]]

## RedisBloom

[RedisBloom](https://oss.redis.com/redisbloom/Quick_Start/#building) is a Redis module that adds
support for Bloom and Cuckoo filters, a count-min sketch, and a top-k. First you need to compile
RedisBloom module:

```shell
git clone --recursive https://github.com/RedisBloom/RedisBloom.git
cd redisbloom
make
```

And then load the module when you start a Redis instance:

```shell
/path/to/redis-server --loadmodule ./redisbloom.so
```

You can find the source code for the examples below at
[GitHub](https://github.com/redis/go-redis/tree/master/example/redis-bloom).

## Bloom vs. Cuckoo

Bloom and cuckoo filters are probabilistic data structures that report whether an item has been seen
before (is a member of a set). Both filters use hash functions and can report false positives due to
hash collisions (but not false negatives).

From the [docs](https://oss.redis.com/redisbloom/#bloom-vs-cuckoo):

> Bloom filters typically exhibit better performance and scalability when inserting items (so if
> you're often adding items to your dataset, then a Bloom filter may be ideal). Cuckoo filters are
> quicker on check operations and also allow deletions.

Bloom filters are also considerably smaller than Cuckoo filters:

```
127.0.0.1:6379> BF.RESERVE bloom_key 0.1 100000
OK
127.0.0.1:6379> MEMORY USAGE bloom_key
(integer) 78080

127.0.0.1:6379> CF.RESERVE cf_key 100000
OK
127.0.0.1:6379> MEMORY USAGE cf_key
(integer) 131160
```

## Bloom and Cuckoo

You can execute Redis Bloom [commands](https://oss.redis.com/redisbloom/Bloom_Commands/) using
general [Do](https://pkg.go.dev/github.com/redis/go-redis/v9#Client.Do) function and then retrieve
the result with [Cmd](https://pkg.go.dev/github.com/redis/go-redis/v9#Cmd) helpers:

```go
func bloomFilter(ctx context.Context, rdb *redis.Client) {
	inserted, err := rdb.Do(ctx, "BF.ADD", "bf_key", "item0").Bool()
	if err != nil {
		panic(err)
	}
	if inserted {
		fmt.Println("item0 was inserted")
	}

	for _, item := range []string{"item0", "item1"} {
		exists, err := rdb.Do(ctx, "BF.EXISTS", "bf_key", item).Bool()
		if err != nil {
			panic(err)
		}
		if exists {
			fmt.Printf("%s does exist\n", item)
		} else {
			fmt.Printf("%s does not exist\n", item)
		}
	}
}
```

Cuckoo [commands](https://oss.redis.com/redisbloom/Cuckoo_Commands/) look very similar:

```go
func cuckooFilter(ctx context.Context, rdb *redis.Client) {
	inserted, err := rdb.Do(ctx, "CF.ADDNX", "cf_key", "item0").Bool()
	if err != nil {
		panic(err)
	}
	if inserted {
		fmt.Println("item0 was inserted")
	} else {
		fmt.Println("item0 already exists")
	}

	for _, item := range []string{"item0", "item1"} {
		exists, err := rdb.Do(ctx, "CF.EXISTS", "cf_key", item).Bool()
		if err != nil {
			panic(err)
		}
		if exists {
			fmt.Printf("%s does exist\n", item)
		} else {
			fmt.Printf("%s does not exist\n", item)
		}
	}

	deleted, err := rdb.Do(ctx, "CF.DEL", "cf_key", "item0").Bool()
	if err != nil {
		panic(err)
	}
	if deleted {
		fmt.Println("item0 was deleted")
	}
}
```

## Count-Min sketch

[Count-Min Sketch](https://oss.redis.com/redisbloom/CountMinSketch_Commands/) is a probabilistic
data structure for computing approximate counts using hash functions. It may overcount some items
due to hash collisions.

```go
func countMinSketch(ctx context.Context, rdb *redis.Client) {
	if err := rdb.Do(ctx, "CMS.INITBYPROB", "count_min", 0.001, 0.01).Err(); err != nil {
		panic(err)
	}

	items := []string{"item1", "item2", "item3", "item4", "item5"}
	counts := make(map[string]int, len(items))

	for i := 0; i < 10000; i++ {
		n := rand.Intn(len(items))
		item := items[n]

		if err := rdb.Do(ctx, "CMS.INCRBY", "count_min", item, 1).Err(); err != nil {
			panic(err)
		}
		counts[item]++
	}

	for item, count := range counts {
		ns, err := rdb.Do(ctx, "CMS.QUERY", "count_min", item).Int64Slice()
		if err != nil {
			panic(err)
		}
		fmt.Printf("%s: count-min=%d actual=%d\n", item, ns[0], count)
	}
}
```

## Top-K

A [top-k](https://oss.redis.com/redisbloom/TopK_Commands/) maintains a list of `k` most frequently
seen items. It uses probabilistic counters and may undercount some items.

```go
func topK(ctx context.Context, rdb *redis.Client) {
	if err := rdb.Do(ctx, "TOPK.RESERVE", "top_items", 3).Err(); err != nil {
		panic(err)
	}

	counts := map[string]int{
		"item1": 1000,
		"item2": 2000,
		"item3": 3000,
		"item4": 4000,
		"item5": 5000,
		"item6": 6000,
	}

	for item, count := range counts {
		for i := 0; i < count; i++ {
			if err := rdb.Do(ctx, "TOPK.INCRBY", "top_items", item, 1).Err(); err != nil {
				panic(err)
			}
		}
	}

	items, err := rdb.Do(ctx, "TOPK.LIST", "top_items").StringSlice()
	if err != nil {
		panic(err)
	}

	for _, item := range items {
		ns, err := rdb.Do(ctx, "TOPK.COUNT", "top_items", item).Int64Slice()
		if err != nil {
			panic(err)
		}
		fmt.Printf("%s: top-k=%d actual=%d\n", item, ns[0], counts[item])
	}
}
```
