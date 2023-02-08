---
title: Go Redis 客户端
---

<CoverImage title="Go Redis 客户端" />

## 客户端列表

[go-redis](https://github.com/redis/go-redis) 提供各种类型的客户端：

- [Redis单节点客户端](go-redis.html)
- [Redis集群客户端](go-redis-cluster.html)
- [Redis哨兵客户端](go-redis-sentinel.html)
- [Redis分片客户端](ring.html)
- [Redis通用客户端](universal.html)

go-redis也可以用于 [kvrocks](https://github.com/apache/incubator-kvrocks), kvrocks是分布式键值NoSQL数据库，
使用RocksDB作为存储引擎，兼容redis协议。

## 相关功能

- [分布式锁](https://github.com/bsm/redislock).
- [Mock测试](https://github.com/go-redis/redismock).
- [Redis缓存](go-redis-cache.html).
- [Redis限流](go-redis-rate-limiting.html).

如果你有相关的功能或库，欢迎联系我们或发送PR。
