package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/hub"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type MessageHandler struct {
	store *store.Store
	hub   *hub.Hub
}

func NewMessageHandler(s *store.Store, h *hub.Hub) *MessageHandler {
	return &MessageHandler{store: s, hub: h}
}

// GET /channels/:id/messages
func (h *MessageHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	channelID := chi.URLParam(r, "id")
	channelUUID, err := pgutil.ParseToPGUUID(channelID)
	if err != nil {
		response.BadRequest(w, "MSG_001", "invalid channel id", "must be a valid UUID")
		return
	}

	// try ring buffer first
	cached := h.hub.GetHistory(channelID)
	if len(cached) > 0 {
		response.Success(w, http.StatusOK, "messages fetched", map[string]any{
			"messages": cached,
			"source":   "cache",
		})
		return
	}

	// fall back to DB
	var before *time.Time
	if b := r.URL.Query().Get("before"); b != "" {
		t, err := time.Parse(time.RFC3339, b)
		if err == nil {
			before = &t
		}
	}

	var column2 pgtype.Timestamptz
	if before != nil {
		column2.Time = *before
		column2.Valid = true
	}

	msgs, err := h.store.Queries.GetChannelMessages(r.Context(), db.GetChannelMessagesParams{
		ChannelID: channelUUID,
		Column2:   column2,
		Limit:     50,
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "MSG_002", "failed to fetch messages", err.Error())
		return
	}

	response.Success(w, http.StatusOK, "messages fetched", map[string]any{
		"messages": msgs,
		"source":   "db",
	})
}

// GET /messages/:id/thread
func (h *MessageHandler) GetThread(w http.ResponseWriter, r *http.Request) {
	parentID := chi.URLParam(r, "id")
	parentUUID, err := pgutil.ParseToPGUUID(parentID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "MSG_001", "invalid parent id", "parent ID must be a valid UUID")
		return
	}
	msgs, err := h.store.Queries.GetThreadMessages(r.Context(), parentUUID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "MSG_003", "failed to retrieve thread messages", err.Error())
		return
	}
	response.Success(w, http.StatusOK, "thread messages retrieved", msgs)
}

// PATCH /messages/:id
func (h *MessageHandler) EditMessage(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "AUTH_001", "authentication required", "user ID not found in request context")
		return
	}

	msgID := chi.URLParam(r, "id")
	msgUUID, err := pgutil.ParseToPGUUID(msgID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "MSG_004", "invalid message id", "message ID must be a valid UUID")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Content == "" {
		response.Error(w, http.StatusBadRequest, "MSG_005", "content is required", "message content cannot be empty")
		return
	}

	senderUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "AUTH_002", "invalid user id", "failed to parse user ID from context")
		return
	}

	msg, err := h.store.Queries.EditMessage(r.Context(), db.EditMessageParams{
		ID:       msgUUID,
		Content:  req.Content,
		SenderID: senderUUID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			response.Error(w, http.StatusNotFound, "MSG_012", "message not found", "message does not exist or does not belong to the user")
			return
		}
		response.Error(w, http.StatusInternalServerError, "MSG_006", "failed to edit message", err.Error())
		return
	}

	response.Success(w, http.StatusOK, "message edited", msg)
}

// DELETE /messages/:id
func (h *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "AUTH_001", "authentication required", "user ID not found in request context")
		return
	}

	msgID := chi.URLParam(r, "id")
	msgUUID, err := pgutil.ParseToPGUUID(msgID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "MSG_004", "invalid message id", "message ID must be a valid UUID")
		return
	}

	senderUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "AUTH_002", "invalid user id", "failed to parse user ID from context")
		return
	}

	existingMessage, err := h.store.Queries.GetMessageByID(r.Context(), msgUUID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			response.Error(w, http.StatusNotFound, "MSG_007", "message not found", "no message found with the given ID")
			return
		}
		response.Error(w, http.StatusInternalServerError, "MSG_008", "failed to retrieve message", err.Error())
		return
	}

	if existingMessage.SenderID != senderUUID {
		response.Error(w, http.StatusForbidden, "MSG_009", "forbidden", "only the message sender can delete their messages")
		return
	}

	if err := h.store.Queries.DeleteMessage(r.Context(), db.DeleteMessageParams{
		ID:       msgUUID,
		SenderID: senderUUID,
	}); err != nil {
		response.Error(w, http.StatusInternalServerError, "MSG_010", "failed to delete message", err.Error())
		return
	}

	response.Success(w, http.StatusOK, "message deleted successfully", nil)
}
