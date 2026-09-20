package queue

import (
	"context"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

type Server struct {
	asynq *asynq.Server
	mux   *asynq.ServeMux
}

func NewServer(redisURL string) (*Server, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	srv := asynq.NewServer(opt, asynq.Config{
		Concurrency: 5,
		Queues: map[string]int{
			"critical": 6,
			"default":  3,
			"low":      1,
		},
		ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
			log.Printf("task %s failed: %v", task.Type(), err)
		}),
	})

	return &Server{
		asynq: srv,
		mux:   asynq.NewServeMux(),
	}, nil
}

func (s *Server) Register(taskType string, handler asynq.HandlerFunc) {
	s.mux.HandleFunc(taskType, handler)
}

func (s *Server) Start() error {
	return s.asynq.Run(s.mux)
}

func (s *Server) Stop() {
	s.asynq.Shutdown()
}
