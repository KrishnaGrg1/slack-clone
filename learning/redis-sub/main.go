package learning

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{
		Addr: "redis://localhost:6379",
	})
	sub := rdb.Subscribe(ctx, "room:general")
	defer sub.Close()
	fmt.Println("Listening on room:general....")
	for msg := range sub.Channel() {
		fmt.Println("received", msg.Payload)
	}
}
