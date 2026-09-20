package queue

import (
	"context"
	"fmt"

	"github.com/hibiken/asynq"
)

// Task type constants — one place, used everywhere
const (
	TypeProcessRecording = "recording:process"
	TypeSendEmail        = "email:send"
)

type Queue struct {
	asynq *asynq.Client
}

func NewClient(redisURL string) (*Queue, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url%s", err)
	}
	return &Queue{
		asynq: asynq.NewClient(opt),
	}, nil
}

func (c *Queue) Enqueue(ctx context.Context, task *asynq.Task, opts ...asynq.Option) error {
	_, err := c.asynq.EnqueueContext(ctx, task, opts...)
	return err
}

func (q *Queue) Close() error {
	return q.asynq.Close()
}
