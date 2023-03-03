---
title: 'Redis: Scanning hash fields into a struct'
---

<CoverImage title="Scanning hash fields into a struct" />

Commands that return multiple keys and values provide a helper to scan results into a struct, for
example, such commands as `HGetAll`, `HMGet`, and `MGet`.

You can use `redis` struct field tag to change field names or completely ignore some fields:

```go
type Model struct {
	Str1    string   `redis:"str1"`
	Str2    string   `redis:"str2"`
	Int     int      `redis:"int"`
	Bool    bool     `redis:"bool"`
	Ignored struct{} `redis:"-"`
}
```

Because go-redis does not provide a helper to save structs in Redis, we are using a pipeline to load
some data into our database:

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

After that we are ready to scan the data using `HGetAll`:

```go
var model1 Model
// Scan all fields into the model.
if err := rdb.HGetAll(ctx, "key").Scan(&model1); err != nil {
	panic(err)
}
```

Or `HMGet`:

```go
var model2 Model
// Scan a subset of the fields.
if err := rdb.HMGet(ctx, "key", "str1", "int").Scan(&model2); err != nil {
	panic(err)
}
```

You can also find the example above on
[GitHub](https://github.com/redis/go-redis/tree/master/example/scan-struct).

You can also write the value of the struct field into redis, such as the `MSet` and `HSet` commands:

```go
if err := rdb.HSet(ctx, "key", model1).Err(); err != nil {
	panic(err)
}
```
