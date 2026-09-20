package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/KrishnaGrg1/slack-clone/internal/openrouter"
	"github.com/KrishnaGrg1/slack-clone/internal/queue"
	"github.com/KrishnaGrg1/slack-clone/internal/storage"
	"github.com/hibiken/asynq"
)

type RecordingProcess struct {
	ors     *openrouter.OpenRouterService
	storage *storage.StorageService
}

func NewRecordingProcess(ors *openrouter.OpenRouterService, storage *storage.StorageService) *RecordingProcess {
	return &RecordingProcess{
		ors:     ors,
		storage: storage,
	}
}

func (p *RecordingProcess) ProcessTask(ctx context.Context, t *asynq.Task) error {

	var payload queue.RecordingPayload

	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("unmarshal payload: %w", err)
	}
	log.Printf("processing recording for call %s", payload.CallID)

	// download from minio
	tmpPath, err := p.storage.DownloadToTemp(ctx, payload.ObjectName)

	if err != nil {
		return fmt.Errorf("download audio: %w", err)
	}

	// transcribe the audio
	transcript, err := p.ors.TranscribeAudio(ctx, tmpPath)
	if err != nil {
		return fmt.Errorf("transcribe: %w", err)
	}

	log.Printf("call %s transcribed: %d chars", payload.CallID, len(transcript))

	// Step 3 — summarize with OpenRouter LLM
	summary, err := p.ors.SummarizeHuddle(ctx, transcript)
	if err != nil {
		log.Printf("summarization failed, using raw transcript: %v", err)
		summary = transcript
	}
	// Step 4 — TODO: INSERT call_summaries + WS broadcast to thread
	_ = summary
	_ = payload.ThreadID
	log.Printf("call %s summary ready", payload.CallID)
	return nil
}
