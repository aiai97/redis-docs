---
title: Redis PubSub 发布订阅
---

<CoverImage title="Go Redis PubSub 发布订阅" />

go-redis 支持发布+订阅消息，当出现网络等异常时，会自动重新连接服务器。

注意：PubSub使用连接池以外的网络连接。

发布一条消息:

```go
err := rdb.Publish(ctx, "mychannel1", "payload").Err()
if err != nil {
	panic(err)
}
```

订阅一个Channel，`Subscribe` 方法并不会返回错误，如果存在错误，在读取消息时返回，
使用完毕后，你有义务关闭它:

```go
pubsub := rdb.Subscribe(ctx, "mychannel1")

// 使用完毕，记得关闭
defer pubsub.Close()
```

读取消息:

```go
for {
	msg, err := pubsub.ReceiveMessage(ctx)
	if err != nil {
		panic(err)
	}

	fmt.Println(msg.Channel, msg.Payload)
}
```

你也可以直接操作 `go chan` 一样读取消息：

```go
ch := pubsub.Channel()

for msg := range ch {
	fmt.Println(msg.Channel, msg.Payload)
}
```
