package db

import (
	"context"
	"log"
	"time"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type DBWriter struct {
	queries *db.Queries
	jobs    chan WriteJob
}

type WriteJob struct {
	ChannelID string
	SenderID  string
	Content   string
	ParentID  string // empty string = top-level message
}

func NewDBWriter(queries *db.Queries) *DBWriter {
	return &DBWriter{
		queries: queries,
		jobs:    make(chan WriteJob, 512), // buffered — hub never blocks
	}
}

func (w *DBWriter) Enqueue(job WriteJob) {
	select {
	case w.jobs <- job:
	default:
		log.Println("db writer buffer full, dropping message")
	}
}

func (w *DBWriter) Run(ctx context.Context) {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	var batch []WriteJob

	for {
		select {
		case <-ctx.Done():
			// flush remaining on shutdown
			if len(batch) > 0 {
				w.flush(ctx, batch)
			}
			return

		case job := <-w.jobs:
			batch = append(batch, job)

		case <-ticker.C:
			if len(batch) == 0 {
				continue
			}
			w.flush(ctx, batch)
			batch = batch[:0] // reset without reallocating
		}
	}
}

func (w *DBWriter) flush(ctx context.Context, batch []WriteJob) {
	for _, job := range batch {
		channelUUID, err := uuid.Parse(job.ChannelID)
		if err != nil {
			log.Println("invalid channel id:", job.ChannelID)
			continue
		}
		senderUUID, err := uuid.Parse(job.SenderID)
		if err != nil {
			log.Println("invalid sender id:", job.SenderID)
			continue
		}

		params := db.CreateMessageParams{
			ChannelID: pgtype.UUID{Bytes: [16]byte(channelUUID), Valid: true},
			SenderID:  pgtype.UUID{Bytes: [16]byte(senderUUID), Valid: true},
			Content:   job.Content,
			MsgType:   pgtype.Text{String: "text", Valid: true},
		}

		// set parent if thread reply
		if job.ParentID != "" {
			parentUUID, err := uuid.Parse(job.ParentID)
			if err == nil {
				params.ParentID = pgtype.UUID{Bytes: [16]byte(parentUUID), Valid: true}
			}
		}

		if _, err := w.queries.CreateMessage(ctx, params); err != nil {
			log.Println("failed to insert message:", err)
		}
	}
}
