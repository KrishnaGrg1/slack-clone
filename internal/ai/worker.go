package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/openrouter"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/queue"
	"github.com/KrishnaGrg1/slack-clone/internal/storage"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgtype"
)

type RecordingProcess struct {
	ors           *openrouter.OpenRouterService
	storage       *storage.StorageService
	store         *store.Store
	notifySummary func(channelID string, payload []byte)
}

func NewRecordingProcess(
	ors *openrouter.OpenRouterService,
	storage *storage.StorageService,
	store *store.Store,
	notifySummary func(channelID string, payload []byte),
) *RecordingProcess {
	return &RecordingProcess{
		ors:           ors,
		storage:       storage,
		store:         store,
		notifySummary: notifySummary,
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
	defer func() {
		if removeErr := os.Remove(tmpPath); removeErr != nil {
			log.Printf("failed to remove temp recording %s: %v", tmpPath, removeErr)
		}
	}()

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

	callID, err := pgutil.ParseToPGUUID(payload.CallID)
	if err != nil {
		return fmt.Errorf("parse call id: %w", err)
	}
	channelID, err := pgutil.ParseToPGUUID(payload.ChannelID)
	if err != nil {
		return fmt.Errorf("parse channel id: %w", err)
	}
	senderID, err := pgutil.ParseToPGUUID(payload.SenderID)
	if err != nil {
		return fmt.Errorf("parse sender id: %w", err)
	}

	if _, err := p.store.Queries.CreateCallSummaries(ctx, db.CreateCallSummariesParams{
		CallID:     callID,
		Transcript: pgtype.Text{String: transcript, Valid: true},
		Summary:    pgtype.Text{String: summary, Valid: true},
	}); err != nil {
		return fmt.Errorf("persist summary: %w", err)
	}

	var threadID pgtype.UUID
	if payload.ThreadID != "" {
		threadID, err = pgutil.ParseToPGUUID(payload.ThreadID)
		if err != nil {
			return fmt.Errorf("parse thread id: %w", err)
		}
	}

	if _, err := p.store.Queries.CreateMessage(ctx, db.CreateMessageParams{
		ChannelID: channelID,
		SenderID:  senderID,
		Content:   summary,
		ThreadID:  threadID,
		MsgType:   "call_summary",
	}); err != nil {
		return fmt.Errorf("persist summary message: %w", err)
	}

	if p.notifySummary != nil {
		broadcast, _ := json.Marshal(map[string]any{
			"msg_type":   "call.summary_ready",
			"call_id":    payload.CallID,
			"channel_id": payload.ChannelID,
			"summary":    summary,
			"transcript": transcript,
		})
		p.notifySummary(payload.ChannelID, broadcast)
	}
	log.Printf("call %s summary ready", payload.CallID)
	return nil
}
