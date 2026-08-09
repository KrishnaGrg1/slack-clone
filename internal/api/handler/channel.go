package handler

import (
	"net/http"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type ChannelHandler struct {
	store *store.Store
}

func NewChannelHandler(s *store.Store) *ChannelHandler {
	return &ChannelHandler{
		store: s,
	}
}

type CreateChannelInput struct {
	Name      string `json:"name"`
	IsPrivate bool   `json:"is_private"`
}

// POST /channels
func (h *ChannelHandler) CreateChannel(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req struct {
		Name      string `json:"name"`
		IsPrivate bool   `json:"is_private"`
	}
	if err := response.Read(r, &req); err != nil {
		response.BadRequest(w, "CH_001", "invalid request body", "request body must be valid JSON")
		return
	}
	if req.Name == "" {
		response.BadRequest(w, "CH_002", "name is required", "channel name cannot be empty")
		return
	}

	uid, _ := uuid.Parse(userID)
	creatorID := pgtype.UUID{Bytes: [16]byte(uid), Valid: true}

	channel, err := h.store.Queries.CreateChannel(r.Context(), db.CreateChannelParams{
		Name:      req.Name,
		IsPrivate: pgtype.Bool{Bool: req.IsPrivate, Valid: true},
		CreatedBy: creatorID,
	})
	if err != nil {
		response.InternalServerError(w, "CH_003", "failed to create channel", err.Error())
		return
	}

	// creator auto-joins the channel
	_ = h.store.Queries.JoinChannel(r.Context(), db.JoinChannelParams{
		ChannelID: channel.ID,
		UserID:    creatorID,
	})

	response.Success(w, http.StatusCreated, "channel created", channel)
}
