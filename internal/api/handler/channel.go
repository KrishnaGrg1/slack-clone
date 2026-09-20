package handler

import (
	"net/http"
	"strings"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
)

// ChannelType is the allowed set of channel visibility values.
type ChannelType string

const (
	ChannelTypePublic  ChannelType = "public"
	ChannelTypePrivate ChannelType = "private"
)

// IsValid reports whether c is a recognised ChannelType.
func (c ChannelType) IsValid() bool {
	return c == ChannelTypePublic || c == ChannelTypePrivate
}

// CreateChannelInput is the request body for POST /channels.
type CreateChannelInput struct {
	Name        string      `json:"name"`
	ChannelType ChannelType `json:"channel_type"`
}

// ChannelHandler holds the dependencies for all channel-related routes.
type ChannelHandler struct {
	store *store.Store
}

// NewChannelHandler constructs a ChannelHandler.
func NewChannelHandler(store *store.Store) *ChannelHandler {
	return &ChannelHandler{store: store}
}

// CreateChannel handles POST /api/v1/workspaces/{workspaceID}/channels.
//
// The WorkspaceAuth middleware has already verified that the caller is an
// authenticated member of the workspace and injected both UUIDs into ctx.
func (h *ChannelHandler) CreateChannel(w http.ResponseWriter, r *http.Request) {

	// --------------------------------------------------
	// 1. Read caller identity from context (set by WorkspaceAuth)
	// --------------------------------------------------

	workspaceUUID, _ := middleware.WorkspaceUUIDFromCtx(r.Context())
	userUUID, _ := middleware.UserUUIDFromCtx(r.Context())

	// --------------------------------------------------
	// 2. Decode and validate request body
	// --------------------------------------------------

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

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		response.BadRequest(
			w,
			"CH_002",
			"name is required",
			"channel name cannot be empty",
		)
		return
	}

	if !req.ChannelType.IsValid() {
		response.BadRequest(
			w,
			"CH_003",
			"invalid channel type",
			`channel type must be "public" or "private"`,
		)
		return
	}

	// --------------------------------------------------
	// 3. Persist channel
	// --------------------------------------------------

	channel, err := h.store.Queries.CreateChannel(
		r.Context(),
		db.CreateChannelParams{
			Name:        req.Name,
			ChannelType: string(req.ChannelType),
			CreatedBy:   userUUID,
			WorkspaceID: workspaceUUID,
		},
	)
	if err != nil {
		response.InternalServerError(
			w,
			"CH_004",
			"failed to create channel",
			err.Error(),
		)
		return
	}

	// --------------------------------------------------
	// 4. Auto-join creator
	// --------------------------------------------------

	if err := h.store.Queries.JoinChannel(
		r.Context(),
		db.JoinChannelParams{
			ChannelID: channel.ID,
			UserID:    userUUID,
		},
	); err != nil {
		response.InternalServerError(
			w,
			"CH_005",
			"channel created but failed to add creator as member",
			err.Error(),
		)
		return
	}

	response.Success(w, http.StatusCreated, "channel created", channel)
}

// GetChannels handles GET /api/v1/workspaces/{workspaceID}/channels.
//
// Returns all channels visible within the workspace.
// WorkspaceAuth guarantees the caller is a workspace member.
func (h *ChannelHandler) GetChannels(w http.ResponseWriter, r *http.Request) {
	workspaceUUID, _ := middleware.WorkspaceUUIDFromCtx(r.Context())
	userUUID, _ := middleware.UserUUIDFromCtx(r.Context())

	channels, err := h.store.Queries.GetChannelsByWorkspace(r.Context(), db.GetChannelsByWorkspaceParams{
		WorkspaceID: workspaceUUID,
		UserID:      userUUID,
	})
	if err != nil {
		response.InternalServerError(w, "CH_006", "failed to fetch channels", err.Error())
		return
	}

	response.Success(w, http.StatusOK, "channels fetched", channels)
}

// GetChannel handles GET /api/v1/workspaces/{workspaceID}/channels/{id}.
//
// Returns a single channel together with its member list.
func (h *ChannelHandler) GetChannel(w http.ResponseWriter, r *http.Request) {

	channelUUID, err := pgutil.ParseToPGUUID(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(
			w,
			"CH_007",
			"invalid channel ID",
			"channel ID must be a valid UUID",
		)
		return
	}

	channel, err := h.store.Queries.GetChannelById(r.Context(), channelUUID)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"channel not found",
			"CH_008",
			"no channel with that ID",
		)
		return
	}

	members, err := h.store.Queries.GetChannelMembers(r.Context(), channelUUID)
	if err != nil {
		response.InternalServerError(
			w,
			"CH_009",
			"failed to fetch channel members",
			err.Error(),
		)
		return
	}

	response.Success(w, http.StatusOK, "channel fetched", map[string]any{
		"channel":         channel,
		"channel_members": members,
	})
}

// JoinChannel handles POST /api/v1/workspaces/{workspaceID}/channels/{id}/join.
func (h *ChannelHandler) JoinChannel(w http.ResponseWriter, r *http.Request) {

	userUUID, _ := middleware.UserUUIDFromCtx(r.Context())

	channelUUID, err := pgutil.ParseToPGUUID(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(
			w,
			"CH_010",
			"invalid channel ID",
			"channel ID must be a valid UUID",
		)
		return
	}

	// Confirm channel exists
	channel, err := h.store.Queries.GetChannelById(r.Context(), channelUUID)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"channel not found",
			"CH_011",
			"no channel with that ID",
		)
		return
	}

	// Guard duplicate membership
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
			"CH_012",
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
			"CH_013",
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
			"CH_014",
			"failed to join channel",
			err.Error(),
		)
		return
	}

	response.Success(w, http.StatusOK, "joined channel", channel)
}

// LeaveChannel handles POST /api/v1/workspaces/{workspaceID}/channels/{id}/leave.
func (h *ChannelHandler) LeaveChannel(w http.ResponseWriter, r *http.Request) {

	userUUID, _ := middleware.UserUUIDFromCtx(r.Context())

	channelUUID, err := pgutil.ParseToPGUUID(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(
			w,
			"CH_015",
			"invalid channel ID",
			"channel ID must be a valid UUID",
		)
		return
	}

	// Confirm channel exists
	if _, err := h.store.Queries.GetChannelById(r.Context(), channelUUID); err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"channel not found",
			"CH_016",
			"no channel with that ID",
		)
		return
	}

	// Guard: must be a member to leave
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
			"CH_017",
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
			"CH_018",
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
			"CH_019",
			"failed to leave channel",
			err.Error(),
		)
		return
	}

	response.Success(w, http.StatusOK, "left channel", nil)
}
