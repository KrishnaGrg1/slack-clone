package learning

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr: "redis://localhost:6379",
	})

	rdb.Set(ctx, "presence:krishna", "online", 13*time.Second)

	val, _ := rdb.Get(ctx, "presence:krishna").Result()
	fmt.Println("status:", val)

	time.Sleep(11 * time.Second)

	val, err := rdb.Get(ctx, "presence:krishna").Result()
	if err == redis.Nil {
		fmt.Println("key expired — user is offline")
	} else {
		fmt.Println("still online:", val)
	}
}
