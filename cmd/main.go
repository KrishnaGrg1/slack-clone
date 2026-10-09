package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/KrishnaGrg1/slack-clone/internal/ai"
	apiRouter "github.com/KrishnaGrg1/slack-clone/internal/api"
	"github.com/KrishnaGrg1/slack-clone/internal/api/handler"
	"github.com/KrishnaGrg1/slack-clone/internal/config"
	"github.com/KrishnaGrg1/slack-clone/internal/db"
	"github.com/KrishnaGrg1/slack-clone/internal/hub"
	"github.com/KrishnaGrg1/slack-clone/internal/openrouter"
	"github.com/KrishnaGrg1/slack-clone/internal/queue"
	"github.com/KrishnaGrg1/slack-clone/internal/redis"
	"github.com/KrishnaGrg1/slack-clone/internal/storage"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	whisper "github.com/KrishnaGrg1/slack-clone/internal/whipser"
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
	h := hub.NewHub(rdb, writer, s)
	go h.Run()

	queueClient, err := queue.NewClient(cfg.REDIS_URL)
	if err != nil {
		log.Fatal("queue client:", err)
	}
	defer queueClient.Close()

	queueServer, err := queue.NewServer(cfg.REDIS_URL)
	if err != nil {
		log.Fatal("queue server:", err)
	}

	ors := openrouter.NewOpenRouterService(cfg.OPENROUTER_API_KEY, cfg.OPENROUTER_MODEL, cfg.OPENROUTER_AUDIO_MODEL)
	st, err := storage.NewMinIOStorage(cfg.MINIO_URL, cfg.MINIO_ACESSKEY, cfg.MINIO_SECRET_ACESSKEY)
	if err != nil {
		log.Fatal("storage:", err)
	}

	ts := whisper.NewTranscribeService(cfg.WHISPER_URL)
	recordingProcessor := ai.NewRecordingProcess(ors, ts, st, s, h.NotifyRoom)
	queueServer.Register(queue.TypeProcessRecording, recordingProcessor.ProcessTask)
	go func() {
		if err := queueServer.Start(); err != nil {
			log.Fatal("queue server:", err)
		}
	}()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go writer.Run(ctx)

	callHandler := handler.NewCallHandler(s, ors, st, queueClient)
	router := apiRouter.NewRouter(cfg, s, h, callHandler)

	log.Println("Server running on", cfg.PORT)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}

}
