---
title: Go Redis Lua 脚本
---

<CoverImage title="Go Redis Lua 脚本" />

[[toc]]

## redis.Script

go-redis支持Lua脚本 [redis.Script](https://pkg.go.dev/github.com/redis/go-redis/v9#Script)，
在 [这里](https://github.com/redis/go-redis/tree/master/example/lua-scripting) 查看使用示例。

在下面的示例中，Lua脚本使用 GET, SET 实现了 `INCRBY`命令：

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

你可以像这样运行脚本:

```go
keys := []string{"my_counter"}
values := []interface{}{+1}
num, err := incrBy.Run(ctx, rdb, keys, values...).Int()
```

在go-redis中，使用 [EVALSHA](https://redis.io/commands/evalsha) 执行脚本，
如果SHA不存在，则使用 [EVAL](https://redis.io/commands/eval)。

你可以在 [GitHub](https://github.com/redis/go-redis/tree/master/example/lua-scripting) 中找到上面的示例。
更多的例子，你可以参照 [redis_rate](https://github.com/go-redis/redis_rate/blob/v9/lua.go)，
它实现了一个漏桶算法的 [限流器](rate-limiting.md)。

## Lua 和 Go 类型

下面是Lua和Go语言的类型对照表，Lua的number是一个浮点型数字，用于存储整数和浮点数，
在Lua中不区分整数和浮点数，但Redis 总是将 Lua 数字转换为舍去小数部分的整数，例如3.14变成3，
如果要返回浮点值，将其作为字符串返回并用Go解析成float64。

| Lua return                   | Go interface{}                |
| ---------------------------- |-------------------------------|
| `number` (float64)           | `int64` (舍弃小数)             |
| `string`                     | `string`                      |
| `false`                      | `redis.Nil` error             |
| `true`                       | `int64(1)`                    |
| `{ok = "status"}`            | `string("status")`            |
| `{err = "error message"}`    | `errors.New("error message")` |
| `{"foo", "bar"}`             | `[]interface{}{"foo", "bar"}` |
| `{foo = "bar", bar = "baz"}` | `[]interface{}{}` (不支持)     |

## 调试 Lua 脚本

调试 Lua 脚本的最简单方法是使用 `redis.log` 将消息写入 Redis 日志文件或 `redis-server` 输出的函数：

```lua
redis.log(redis.LOG_NOTICE, "key", key, "change", change)
```

你也可以参照 [Redis Lua 脚本调试器](https://redis.io/topics/ldb)

## 传递多个值

你可以 `for` 在 Lua 中使用循环来迭代传递的值，例如对数字求和：

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

结果:

```go
sum, err := sum.Run(ctx, rdb, []string{"my_sum"}, 1, 2, 3).Int()
fmt.Println(sum, err)
// Output: 6 nil
```

## 循环 continue

Lua 循环中不支持 continue 语法，不过你可以使用嵌套repeat循环和break语句来模拟它：

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

## 错误处理

默认情况下，redis.call函数会引发 Lua 错误并停止服务，
如果要捕获错误，需要使用redis.pcall返回带有err字段的 Lua table：

```lua
local result = redis.pcall("rename", "foo", "bar")
if type(result) == 'table' and result.err then
  redis.log(redis.LOG_NOTICE, "rename failed", result.err)
end
```

要返回自定义错误，请使用 Lua table:

```lua
return {err = "error message goes here"}
```
