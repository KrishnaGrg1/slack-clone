package handler

import (
	"net/http"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type ChannelHandler struct {
	store *store.Store
}

func NewChannelHandler(store *store.Store) *ChannelHandler {
	return &ChannelHandler{
		store: store,
	}
}

type CreateChannelInput struct {
	Name      string `json:"name"`
	IsPrivate bool   `json:"is_private"`
}

// POST /channels
func (h *ChannelHandler) CreateChannel(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"AUTH_001",
			"invalid user",
		)
		return
	}

	var req CreateChannelInput

	if err := response.Read(r, &req); err != nil {
		response.BadRequest(
			w,
			"CH_001",
			"invalid request body",
			"request body must be valid JSON",
		)
		return
	}

	if req.Name == "" {
		response.BadRequest(
			w,
			"CH_002",
			"name is required",
			"channel name cannot be empty",
		)
		return
	}

	creatorUUID, err := ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"AUTH_002",
			"invalid user ID",
		)
		return
	}

	channel, err := h.store.Queries.CreateChannel(
		r.Context(),
		db.CreateChannelParams{
			Name:      req.Name,
			IsPrivate: pgtype.Bool{Bool: req.IsPrivate, Valid: true},
			CreatedBy: creatorUUID,
		},
	)
	if err != nil {
		response.InternalServerError(
			w,
			"CH_003",
			"failed to create channel",
			err.Error(),
		)
		return
	}

	// Creator automatically joins the channel.
	if err := h.store.Queries.JoinChannel(
		r.Context(),
		db.JoinChannelParams{
			ChannelID: channel.ID,
			UserID:    creatorUUID,
		},
	); err != nil {
		response.InternalServerError(
			w,
			"CH_004",
			"failed to join channel",
			err.Error(),
		)
		return
	}

	response.Success(
		w,
		http.StatusCreated,
		"channel created",
		channel,
	)
}

func (h *ChannelHandler) GetChannels(w http.ResponseWriter, r *http.Request) {
	channels, err := h.store.Queries.GetChannels(r.Context())
	if err != nil {
		response.InternalServerError(
			w,
			"CH_005",
			"failed to fetch channels",
			err.Error(),
		)
		return
	}

	response.Success(
		w,
		http.StatusOK,
		"channels fetched",
		channels,
	)
}

func (h *ChannelHandler) JoinChannel(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"AUTH_001",
			"invalid user",
		)
		return
	}

	channelID := chi.URLParam(r, "id")

	userUUID, err := ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"AUTH_002",
			"invalid user ID",
		)
		return
	}

	channelUUID, err := ParseToPGUUID(channelID)
	if err != nil {
		response.BadRequest(
			w,
			"CH_006",
			"invalid channel id",
			"channel ID must be a valid UUID",
		)
		return
	}

	channel, err := h.store.Queries.GetChannelById(
		r.Context(),
		channelUUID,
	)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"channel not found",
			"CH_007",
			"No channel with that ID",
		)
		return
	}

	isMember, err := h.store.Queries.IsChannelMember(
		r.Context(),
		db.IsChannelMemberParams{
			ChannelID: channelUUID,
			UserID:    userUUID,
		},
	)
	if err != nil {
		response.InternalServerError(
			w,
			"CH_008",
			"failed to check channel membership",
			err.Error(),
		)
		return
	}

	if isMember {
		response.Error(
			w,
			http.StatusConflict,
			"already a channel member",
			"CH_009",
			"user is already a member of this channel",
		)
		return
	}

	if err := h.store.Queries.JoinChannel(
		r.Context(),
		db.JoinChannelParams{
			ChannelID: channelUUID,
			UserID:    userUUID,
		},
	); err != nil {
		response.InternalServerError(
			w,
			"CH_010",
			"failed to join channel",
			err.Error(),
		)
		return
	}

	response.Success(
		w,
		http.StatusOK,
		"joined channel",
		channel,
	)
}

func (h *ChannelHandler) LeaveChannel(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"AUTH_001",
			"invalid user",
		)
		return
	}

	channelID := chi.URLParam(r, "id")

	userUUID, err := ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"AUTH_002",
			"invalid user ID",
		)
		return
	}

	channelUUID, err := ParseToPGUUID(channelID)
	if err != nil {
		response.BadRequest(
			w,
			"CH_009",
			"invalid channel id",
			"channel ID must be a valid UUID",
		)
		return
	}

	_, err = h.store.Queries.GetChannelById(
		r.Context(),
		channelUUID,
	)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"channel not found",
			"CH_010",
			"No channel with that ID",
		)
		return
	}

	isMember, err := h.store.Queries.IsChannelMember(
		r.Context(),
		db.IsChannelMemberParams{
			ChannelID: channelUUID,
			UserID:    userUUID,
		},
	)
	if err != nil {
		response.InternalServerError(
			w,
			"CH_011",
			"failed to check channel membership",
			err.Error(),
		)
		return
	}

	if !isMember {
		response.Error(
			w,
			http.StatusConflict,
			"not a channel member",
			"CH_012",
			"user must be a member of the channel to leave",
		)
		return
	}

	if err := h.store.Queries.LeaveChannel(
		r.Context(),
		db.LeaveChannelParams{
			ChannelID: channelUUID,
			UserID:    userUUID,
		},
	); err != nil {
		response.InternalServerError(
			w,
			"CH_013",
			"failed to leave channel",
			err.Error(),
		)
		return
	}

	response.Success(
		w,
		http.StatusOK,
		"left channel",
		nil,
	)
}

func (h *ChannelHandler) GetChannel(w http.ResponseWriter, r *http.Request) {
	channelID := chi.URLParam(r, "id")

	channelUUID, err := ParseToPGUUID(channelID)
	if err != nil {
		response.BadRequest(
			w,
			"CH_013",
			"invalid channel id",
			"channel ID must be a valid UUID",
		)
		return
	}

	channel, err := h.store.Queries.GetChannelById(
		r.Context(),
		channelUUID,
	)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"channel not found",
			"CH_014",
			"No channel with that ID",
		)
		return
	}

	channelMembers, err := h.store.Queries.GetChannelMembers(
		r.Context(),
		channelUUID,
	)
	if err != nil {
		response.Error(
			w,
			http.StatusInternalServerError,
			"failed to get channel members",
			"CH_015",
			err.Error(),
		)
		return
	}

	response.Success(w, http.StatusOK, "channel fetched", map[string]any{
		"channel":         channel,
		"channel_members": channelMembers,
	})
}

func ParseToPGUUID(value string) (pgtype.UUID, error) {
	parsedUUID, err := uuid.Parse(value)
	if err != nil {
		return pgtype.UUID{}, err
	}

	return pgtype.UUID{
		Bytes: [16]byte(parsedUUID),
		Valid: true,
	}, nil
}
