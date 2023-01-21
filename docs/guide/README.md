---
title: Go Redis client
---

<CoverImage title="Redis client for Go" />

## Why go-redis?

See [Comparing go-redis vs redigo](/guide/go-redis-vs-redigo.html).

## Clients

[go-redis](https://github.com/go-redis/redis) provides Go clients for various flavors of Redis:

- [Getting started with go-redis](go-redis.html)
- [Redis Cluster client](go-redis-cluster.html)
- [Redis Sentinel client](go-redis-sentinel.html)
- [Redis Ring client](ring.html)
- [Redis Univeral client](universal.html)

This client also works with [kvrocks](https://github.com/apache/incubator-kvrocks), a distributed
key value NoSQL database that uses RocksDB as storage engine and is compatible with Redis protocol.

## Ecosystem

- [Distributed Locks](https://github.com/bsm/redislock).
- [Redis Mock](https://github.com/go-redis/redismock).
- [Redis Cache](go-redis-cache.html).
- [Redis Rate limiting](go-redis-rate-limiting.html).

Send a PR if you want to add your package to the list or promote your Redis-related project.
