---
title: Go Redis Hook 钩子
---

<CoverImage title="Go Redis Hook 钩子" />

go-redis允许配置Hook，在执行命令前后可以做一些工作，也可以改变命令的参数、执行结果等。

Hook采用 `FIFO` 先进先出的模式，即最先添加的hook，最先被执行，以下是hook示例：

```go
// 添加的钩子，必须实现Hook接口
// DialHook: 当创建网络连接时调用的hook
// ProcessHook: 执行命令时调用的hook
// ProcessPipelineHook: 执行管道命令时调用的hook
type Hook interface {
	DialHook(next DialHook) DialHook
	ProcessHook(next ProcessHook) ProcessHook
	ProcessPipelineHook(next ProcessPipelineHook) ProcessPipelineHook
}

// -------- hook1

type Hook1 struct{}

func (Hook1) DialHook(next redis.DialHook) redis.DialHook {
	return func(ctx context.Context, network, addr string) (net.Conn, error) {
        return next(ctx, network, addr)
    }
}
func (Hook1) ProcessHook(next redis.ProcessHook) redis.ProcessHook {
	return func(ctx context.Context, cmd Cmder) error {
		print("hook-1 start")
		next(ctx, cmd)
		print("hook-1 end")
		return nil
	}
}
func (Hook1) ProcessPipelineHook(next redis.ProcessPipelineHook) redis.ProcessPipelineHook {
	return func(ctx context.Context, cmds []Cmder) error {
		return next(ctx, cmds)
    }
}

// -------- hook2

type Hook2 struct{}

func (Hook2) DialHook(next redis.DialHook) redis.DialHook {
    return func(ctx context.Context, network, addr string) (net.Conn, error) {
        next(ctx, network, addr)
    }
}
func (Hook2) ProcessHook(next redis.ProcessHook) redis.ProcessHook {
    return func(ctx context.Context, cmd Cmder) error {
        print("hook-2 start")
        next(ctx, cmd)
        print("hook-2 end")
        return nil
    }
}
func (Hook2) ProcessPipelineHook(next redis.ProcessPipelineHook) redis.ProcessPipelineHook {
    return func(ctx context.Context, cmds []Cmder) error {
        return next(ctx, cmds)
    }
}

// 把两个hook添加到client
client.AddHook(Hook1{}, Hook2{})
client.Get(ctx, "key")
```

如上所述，对client添加了hook1和hook2，2个钩子都对 `ProcessHook` 执行了print函数，
当执行命令时，调用的顺序如下：
```shell
hook-1 start -> hook-2 start -> exec redis cmd -> hook-2 end -> hook-1 end
```
在这里请注意：`next(...)` 操作很重要，是调用下一个hook，在hook调用链中，最后一个hook是redis执行命令操作。

在示例中，如果hook1 ProcessHook 中如果不执行next，则不会执行hook2也不会执行redis命令。

Hook支持三个挂钩点，分别是：

1. DialHook: 当创建网络连接时调用的hook 
2. ProcessHook: 执行命令时调用的hook 
3. ProcessPipelineHook: 执行管道命令时调用的hook

在不同的挂钩点你可以做不同的事，可以统计命令个数计算top key，也可以统计命令执行时间，也可以做一些其它你想要做的操作。

在hook函数中，可以手动为cmd命令设置错误和返回值，调用方将收到你设置的错误和值，这对 `mock` 测试很有用，
在go-redis的 [redismock](https://github.com/go-redis/redismock) 中就利用了hook截断要执行的命令，
对命令写入了测试中期望的返回值或错误。

你也可以返回错误来终止函数，你的错误最终会传递到调用命令的地方。
