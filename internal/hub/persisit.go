package hub

import (
	"context"
	"log/slog"
	"time"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
)

// Persister is the only thing the hub needs. Implement it with sqlc.
type Persister interface {
	Started(ctx context.Context, callID, channelID, startedBy string) error
	Joined(ctx context.Context, callID, userID string) error
	Left(ctx context.Context, callID, userID string, ended bool) error
	CanUploadRecording(ctx context.Context, callID, channelID, userID string) (bool, error)
}

// dbCtx gives each write its own short deadline, independent of the websocket.
func dbCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 3*time.Second)
}

func logErr(op string, err error) {
	if err != nil {
		slog.Error("call persist failed", "op", op, "err", err)
	}
}

type pgPersister struct{ q *store.Store }

func NewpgPersister(store *store.Store) *pgPersister {
	return &pgPersister{
		q: store,
	}
}

func (p *pgPersister) Started(ctx context.Context, callID, channelID, startedBy string) error {

	callUUID, err := pgutil.ParseToPGUUID(callID)
	if err != nil {

	}

	channelUUID, err := pgutil.ParseToPGUUID(channelID)
	if err != nil {

	}
	startedByUUID, err := pgutil.ParseToPGUUID(startedBy)
	if err != nil {
	}

	if _, err := p.q.Queries.CreateCall(ctx, db.CreateCallParams{
		ID:        callUUID,
		ChannelID: channelUUID,
		StartedBy: startedByUUID,
	}); err != nil {
		return err
	}
	return p.q.Queries.AddCallParticipant(ctx, db.AddCallParticipantParams{
		CallID: callUUID,
		UserID: startedByUUID,
	})
}

func (p *pgPersister) Joined(ctx context.Context, callID, userID string) error {
	callUUID, err := pgutil.ParseToPGUUID(callID)
	if err != nil {

	}

	startedByUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
	}
	return p.q.Queries.AddCallParticipant(ctx, db.AddCallParticipantParams{
		CallID: callUUID,
		UserID: startedByUUID,
	})
}

func (p *pgPersister) Left(
	ctx context.Context,
	callID, userID string,
	ended bool,
) error {
	callUUID, err := pgutil.ParseToPGUUID(callID)
	if err != nil {
		return err
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		return err
	}

	if err := p.q.Queries.MarkCallParticipantLeft(
		ctx,
		db.MarkCallParticipantLeftParams{
			CallID: callUUID,
			UserID: userUUID,
		},
	); err != nil {
		return err
	}

	if ended {
		return p.q.Queries.EndCall(ctx, callUUID)
	}

	return nil
}

func (p *pgPersister) CanUploadRecording(
	ctx context.Context,
	callID, channelID, userID string,
) (bool, error) {

	callUUID, err := pgutil.ParseToPGUUID(callID)
	if err != nil {
		return false, err
	}

	channelUUID, err := pgutil.ParseToPGUUID(channelID)
	if err != nil {
		return false, err
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		return false, err
	}

	return p.q.Queries.CanUploadRecording(
		ctx,
		db.CanUploadRecordingParams{
			ID:        callUUID,
			ChannelID: channelUUID,
			UserID:    userUUID,
		},
	)
}
