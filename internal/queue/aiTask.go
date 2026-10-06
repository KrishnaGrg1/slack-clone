package queue

import (
	"encoding/json"

	"github.com/hibiken/asynq"
)

type RecordingPayload struct {
	CallID     string `json:"call_id"`
	ChannelID  string `json:"channel_id"`
	ThreadID   string `json:"thread_id"`
	SenderID   string `json:"sender_id"`
	ObjectName string `json:"object_name"` // MinIO object path
}

func NewProcessRecordingTask(p RecordingPayload) (*asynq.Task, error) {
	data, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeProcessRecording, data), nil
}
