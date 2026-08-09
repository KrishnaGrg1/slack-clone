package main

import (
	"fmt"
	"log"
	"net/http"

	apiRouter "github.com/KrishnaGrg1/slack-clone/internal/api"
	"github.com/KrishnaGrg1/slack-clone/internal/config"
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
	h := hub.NewHub(rdb)
	go h.Run()
	router := apiRouter.NewRouter(cfg, s, h)

	log.Println("Server running on", cfg.PORT)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}

}

//  https://riddle.jankari.tech/c130c106-71e4-4f76-be2b-17b6e9d1c62c?id=cmsj9zxd95i4501rtxoq5uphf&first_name=KirshnaBahadur&last_name=Gurung&ts=1786127991&bts=0000000000000

// https://riddle.jankari.tech/dc1be652-f79b-4891-988f-bb44cb92af81?id=cmsj9zxd95i4501rtxoq5uphf&first_name=KirshnaBahadur&last_name=Gurung&ts=1786128061&bts=1786128078057
