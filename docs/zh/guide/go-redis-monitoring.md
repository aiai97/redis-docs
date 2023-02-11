---
title: Go Redis 监控
---

<CoverImage title="Go Redis 监控" />

这里介绍如何使用 `OpenTelemetry`监控go-redis。

[[toc]]

## 什么是 OpenTelemetry

[OpenTelemetry](https://uptrace.dev/opentelemetry/) 是一个开源的监控框架，用于
[OpenTelemetry tracing](https://uptrace.dev/opentelemetry/distributed-tracing.html)
日志、错误等，以及 `OpenTelemetry metrics` (各种指标)。

Otel 旨在提供可观测性领域的标准化方案，解决观测数据的数据模型、采集、处理、导出等的标准化问题，
提供与三方 vendor 无关的服务。 OpenTelemetry 是一组标准和工具的集合，旨在管理观测类数据，
如 Traces、Metrics、Logs 等 (未来可能有新的观测类数据类型出现)。目前已经是业内的标准。

## OpenTelemetry instrumentation

go-redis有一个单独的OpenTelemetry模块工具 [redisotel](https://github.com/redis/go-redis/tree/master/extra/redisotel)：

```shell
go get github.com/redis/go-redis/extra/redisotel/v9
```

下面是使用示例，支持 `redis.Client`, `redis.ClusterClient`, `redis.Ring`：

```go
import (
    "github.com/redis/go-redis/v9"
    "github.com/redis/go-redis/extra/redisotel/v9"
)

rdb := redis.NewClient(&redis.Options{...})

// 开启 tracing instrumentation.
if err := redisotel.InstrumentTracing(rdb); err != nil {
	panic(err)
}

// 开启 metrics instrumentation.
if err := redisotel.InstrumentMetrics(rdb); err != nil {
	panic(err)
}
```

在使用go-redis执行命令时，需要传递 [trace context](https://uptrace.dev/opentelemetry/go-tracing.html#context)：

```go
ctx := req.Context()
val, err := rdb.Get(ctx, "key").Result()
```

## Uptrace

Uptrace 是 [开源APM](https://uptrace.dev/get/open-source-apm.html)，支持分布式跟踪、指标和日志，
可以使用它来监控应用程序并设置自动警报以通过电子邮件、Slack、Telegram 等接收通知。

你可以使用DEB/RPM包或下载二进制文件来 [安装Uptrace](https://uptrace.dev/get/install.html)。

redisotel 为执行的redis命令创建 [spans](https://uptrace.dev/opentelemetry/distributed-tracing.html#spans) ，
在发生错误是记录错误信息，以下是 [Uptrace](https://app.uptrace.dev/explore/1/?system=db%3Aredis&utm_source=goredis) 展示示例：

![Redis trace](/redis-monitoring/trace.png)

在 [GitHub](https://github.com/redis/go-redis/tree/master/example/otel) 中你可以查看运行示例。

你可以参照 [入门指南](https://uptrace.dev/get/get-started.html) 开始使用Uptrace。

## Prometheus

你还可以使用 [OpenTelemetry Prometheus exporter](https://uptrace.dev/opentelemetry/prometheus-metrics.html)
把 OpenTelemetry 指标发给 Prometheus。

## 查看更多

- [Open Source tracing tools](https://uptrace.dev/get/compare/distributed-tracing-tools.html)
- [OpenTelemetry net/http](https://uptrace.dev/opentelemetry/instrumentations/go-net-http.html)
- [OpenTelemetry gRPC](https://uptrace.dev/opentelemetry/instrumentations/go-grpc.html)
- [OpenTelemetry Gin](https://uptrace.dev/opentelemetry/instrumentations/go-gin.html)
- [OpenTelemetry GORM](https://uptrace.dev/opentelemetry/instrumentations/go-gorm.html)
