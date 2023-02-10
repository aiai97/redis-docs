---
title: Go Redis 字段和结构体映射
---

<CoverImage title="Go Redis 字段和结构体映射" />

go-redis为返回多个key-val的命令提供了一个映射模块将值扫描到结构体中，例如：
`HGetAll`、 `HMGet`、 `MGet` 命令。

你可以使用 `redis` 标签来修改字段名称或忽略一些字段，用法和go json类似：

```go
type Model struct {
	Str1    string   `redis:"str1"`
	Str2    string   `redis:"str2"`
	Int     int      `redis:"int"`
	Bool    bool     `redis:"bool"`
	Ignored struct{} `redis:"-"`
}
```

准备一些测试数据：

```go
rdb := redis.NewClient(&redis.Options{
	Addr: ":6379",
})

if _, err := rdb.Pipelined(ctx, func(rdb redis.Pipeliner) error {
	rdb.HSet(ctx, "key", "str1", "hello")
	rdb.HSet(ctx, "key", "str2", "world")
	rdb.HSet(ctx, "key", "int", 123)
	rdb.HSet(ctx, "key", "bool", 1)
	return nil
}); err != nil {
	panic(err)
}
```

可以使用 `HGetAll` 命令，把结果映射到 `model1` 变量中:

```go
var model1 Model
// 扫描所有字段到model1
if err := rdb.HGetAll(ctx, "key").Scan(&model1); err != nil {
	panic(err)
}
```

或 `HMGet` 命令:

```go
var model2 Model
if err := rdb.HMGet(ctx, "key", "str1", "int").Scan(&model2); err != nil {
	panic(err)
}
```

你可以在 [GitHub](https://github.com/redis/go-redis/tree/master/example/scan-struct) 中找到上面的示例。

同样的，也可以把struct字段值写入到redis中，比如 `MSet`、`HSet` 命令：

```go
if err := rdb.HSet(ctx, "key", model1).Err(); err != nil {
	panic(err)
}
```
