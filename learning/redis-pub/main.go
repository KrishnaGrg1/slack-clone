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
	rdb.Publish(ctx, "room:general", "hello from node 2")
	fmt.Println("published")
}
