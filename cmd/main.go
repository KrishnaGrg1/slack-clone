package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/KrishnaGrg1/slack-clone/internal/ai"
	apiRouter "github.com/KrishnaGrg1/slack-clone/internal/api"
	"github.com/KrishnaGrg1/slack-clone/internal/config"
	"github.com/KrishnaGrg1/slack-clone/internal/db"
	"github.com/KrishnaGrg1/slack-clone/internal/hub"
	"github.com/KrishnaGrg1/slack-clone/internal/openrouter"
	"github.com/KrishnaGrg1/slack-clone/internal/queue"
	"github.com/KrishnaGrg1/slack-clone/internal/redis"
	"github.com/KrishnaGrg1/slack-clone/internal/storage"
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

	//queue task
	queueClient, err := queue.NewClient(cfg.REDIS_URL)
	if err != nil {
		log.Fatal("queue client:", err)
	}
	defer queueClient.Close()

	// queue server — for processing tasks
	queueServer, err := queue.NewServer(cfg.REDIS_URL)
	if err != nil {
		log.Fatal("queue server:", err)
	}

	//register processor
	ors := openrouter.NewOpenRouterService(cfg.OPENROUTER_API_KEY, cfg.OPENROUTER_MODEL, cfg.OPENROUTER_AUDIO_MODEL)
	st, err := storage.NewMinIOStorage()
	if err != nil {
		log.Fatal("storage:", err)
	}
	recordingProcessor := ai.NewRecordingProcess(ors, st)

	//queue in register
	queueServer.Register(queue.TypeProcessRecording, recordingProcessor.ProcessTask)

	// start queue server in background
	go func() {
		if err := queueServer.Start(); err != nil {
			log.Fatal("queue server:", err)
		}
	}()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go writer.Run(ctx)

	router := apiRouter.NewRouter(cfg, s, h, ors, st, queueClient)

	log.Println("Server running on", cfg.PORT)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}

}
