---
title: Go Redis Monitoring Performance
---

<CoverImage title="Monitoring Go Redis Performance and Errors" />

This document explains how to monitor Go Redis client performace using OpenTelemetry. To monitor
Redis server performance and metrics, see
[OpenTelemetry Redis Monitoring](https://uptrace.dev/opentelemetry/redis-monitoring.html).

[[toc]]

## What is OpenTelemetry?

[OpenTelemetry](https://uptrace.dev/opentelemetry/) is an open-source observability framework for
[OpenTelemetry tracing](https://uptrace.dev/opentelemetry/distributed-tracing.html) (including logs
and errors) and [OpenTelemetry metrics](https://uptrace.dev/opentelemetry/metrics.html).

Otel allows developers to collect and export telemetry data in a vendor agnostic way. With
OpenTelemetry, you can instrument your application once and then add or change vendors without
changing the instrumentation, for example, here is a list popular
[DataDog competitors](https://uptrace.dev/blog/datadog-competitors.html) that support OpenTelemetry.

OpenTelemetry is available for most programming languages and provides interoperability across
different languages and environments.

## OpenTelemetry instrumentation

go-redis comes with an OpenTelemetry instrumentation called
[redisotel](https://github.com/redis/go-redis/tree/master/extra/redisotel) that is distributed as a
separate module:

```shell
go get github.com/redis/go-redis/extra/redisotel/v9
```

To instrument Redis client, you need to add the hook provided by redisotel. The same methods can be
used to instrument `redis.Client`, `redis.ClusterClient`, and `redis.Ring`.

```go
import (
    "github.com/redis/go-redis/v9"
    "github.com/redis/go-redis/extra/redisotel/v9"
)

rdb := redis.NewClient(&redis.Options{...})

// Enable tracing instrumentation.
if err := redisotel.InstrumentTracing(rdb); err != nil {
	panic(err)
}

// Enable metrics instrumentation.
if err := redisotel.InstrumentMetrics(rdb); err != nil {
	panic(err)
}
```

To make tracing work, you must pass the active
[trace context](https://uptrace.dev/opentelemetry/go-tracing.html#context) to go-redis commands, for
example:

```go
ctx := req.Context()
val, err := rdb.Get(ctx, "key").Result()
```

## Uptrace

Uptrace is an [open-source APM](https://uptrace.dev/get/open-source-apm.html) that supports
distributed tracing, metrics, and logs. You can use it to monitor applications and set up automatic
alerts to receive notifications via email, Slack, Telegram, and more.

You can [install Uptrace](https://uptrace.dev/get/install.html) by downloading a DEB/RPM package or
a pre-compiled binary.

As expected, redisotel creates
[spans](https://uptrace.dev/opentelemetry/distributed-tracing.html#spans) for processed Redis
commands and records any errors as they occur. Here is how the collected information is displayed at
[Uptrace](https://app.uptrace.dev/explore/1/?system=db%3Aredis&utm_source=goredis):

![Redis trace](/redis-monitoring/trace.png)

You can find a runnable example at
[GitHub](https://github.com/redis/go-redis/tree/master/example/otel).

## Prometheus

You can also send OpenTelemetry metrics to Prometheus using
[OpenTelemetry Prometheus exporter](https://uptrace.dev/opentelemetry/prometheus-metrics.html).

## What's next?

Next, start using Uptrace by following the
[Getting started guide](https://uptrace.dev/get/get-started.html).

Popular instrumentations:

- [Open Source tracing tools](https://uptrace.dev/blog/distributed-tracing-tools.html)
- [OpenTelemetry net/http](https://uptrace.dev/opentelemetry/instrumentations/go-net-http.html)
- [OpenTelemetry gRPC](https://uptrace.dev/opentelemetry/instrumentations/go-grpc.html)
- [OpenTelemetry Gin](https://uptrace.dev/opentelemetry/instrumentations/go-gin.html)
- [OpenTelemetry GORM](https://uptrace.dev/opentelemetry/instrumentations/go-gorm.html)
