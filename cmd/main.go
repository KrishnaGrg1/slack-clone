package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	apiRouter "github.com/KrishnaGrg1/slack-clone/internal/api"
	"github.com/KrishnaGrg1/slack-clone/internal/config"
	"github.com/KrishnaGrg1/slack-clone/internal/db"
	"github.com/KrishnaGrg1/slack-clone/internal/hub"
	"github.com/KrishnaGrg1/slack-clone/internal/redis"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
)

func main() {
	cfg := config.Load()
	s, err := store.Connect(cfg.DB_URL)
	if err != nil {
		log.Fatal(err)
	}
	addr := fmt.Sprintf(":%s", cfg.PORT)
	rdb, err := redis.Connect(cfg.REDIS_URL)
	if err != nil {
		log.Fatal(err)
	}
	writer := db.NewDBWriter(s.Queries) // ← add
	h := hub.NewHub(rdb, writer)
	go h.Run()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go writer.Run(ctx)

	router := apiRouter.NewRouter(cfg, s, h)

	log.Println("Server running on", cfg.PORT)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}

}
