---
title: Go Redis Lua Scripting
---

<UptraceCta />

<CoverImage title="Go Redis Lua Scripting" />

[[toc]]

## redis.Script

go-redis supports Lua scripting with
[redis.Script](https://pkg.go.dev/github.com/redis/go-redis/v9#Script), for
[example](https://github.com/redis/go-redis/tree/master/example/lua-scripting), the following script
implements `INCRBY` command in Lua using `GET` and `SET` commands:

```go
var incrBy = redis.NewScript(`
local key = KEYS[1]
local change = ARGV[1]

local value = redis.call("GET", key)
if not value then
  value = 0
end

value = value + change
redis.call("SET", key, value)

return value
`)
```

You can then run the script like this:

```go
keys := []string{"my_counter"}
values := []interface{}{+1}
num, err := incrBy.Run(ctx, rdb, keys, values...).Int()
```

Internally, go-redis uses [EVALSHA](https://redis.io/commands/evalsha) to execute the script and
fallbacks to [EVAL](https://redis.io/commands/eval) if the script does not exist.

You can find the example above at
[GitHub](https://github.com/redis/go-redis/tree/master/example/lua-scripting). For a more realistic
example, check [redis_rate](https://github.com/go-redis/redis_rate/blob/v9/lua.go) which implements
a leacky bucket [rate-limiter](rate-limiting.md).

## Lua and Go types

Underneath, Lua's `number` type is a `float64` number that is used to store both ints and floats.
Because Lua does not distinguish ints and floats, Redis always converts Lua numbers into ints
discarding the decimal part, for example, `3.14` becomes `3`. If you want to return a float value,
return it as a string and parse the string in Go using
[Float64](https://pkg.go.dev/github.com/redis/go-redis/v9#Cmd.Float64) helper.

| Lua return                   | Go interface{}                      |
| ---------------------------- | ----------------------------------- |
| `number` (float64)           | `int64` (decimal part is discarded) |
| `string`                     | `string`                            |
| `false`                      | `redis.Nil` error                   |
| `true`                       | `int64(1)`                          |
| `{ok = "status"}`            | `string("status")`                  |
| `{err = "error message"}`    | `errors.New("error message")`       |
| `{"foo", "bar"}`             | `[]interface{}{"foo", "bar"}`       |
| `{foo = "bar", bar = "baz"}` | `[]interface{}{}` (not supported)   |

## Debugging Lua scripts

The easiest way to debug your Lua scripts is using `redis.log` function that writes the message to
the Redis log file or `redis-server` output:

```lua
redis.log(redis.LOG_NOTICE, "key", key, "change", change)
```

If you prefer a debugger, check [Redis Lua scripts debugger](https://redis.io/topics/ldb).

## Passing multiple values

You can use `for` loop in Lua to iterate over the passed values, for example, to sum the numbers:

```lua
local key = KEYS[1]

local sum = redis.call("GET", key)
if not sum then
  sum = 0
end

local num_arg = #ARGV
for i = 1, num_arg do
  sum = sum + ARGV[i]
end

redis.call("SET", key, sum)

return sum
```

The result:

```go
sum, err := sum.Run(ctx, rdb, []string{"my_sum"}, 1, 2, 3).Int()
fmt.Println(sum, err)
// Output: 6 nil
```

## Loop continue

Lua does not support `continue` statements in loops, but you can emulate it with a nested `repeat`
loop and a `break` statement:

```lua
local num_arg = #ARGV

for i = 1, num_arg do
repeat

  if true then
    do break end -- continue
  end

until true
end
```

## Error handling

By default, `redis.call` function raises a Lua error and stops program execution. If you want to
handle errors, use `redis.pcall` function which returns a Lua table with `err` field:

```lua
local result = redis.pcall("rename", "foo", "bar")
if type(result) == 'table' and result.err then
  redis.log(redis.LOG_NOTICE, "rename failed", result.err)
end
```

To return a custom error, use a Lua table:

```lua
return {err = "error message goes here"}
```

## Monitoring Performance

!!!include(uptrace.md)!!!

## See also

The following guides can help you get started with Lua scripting in Redis:

- [Lua crash course](https://www.coppeliarobotics.com/helpFiles/en/luaCrashCourse.htm)
- [Learn Lua in 15 Minutes](http://tylerneylon.com/a/learn-lua/)
- [EVAL](https://redis.io/commands/eval)
