package handler

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
	"github.com/jackc/pgx/v5/pgtype"
)

type WorkspaceHandler struct {
	store        *store.Store
	FRONTEND_URL string
}

func NewWorkspaceHandler(store *store.Store, FRONTEND_URL string) *WorkspaceHandler {
	return &WorkspaceHandler{
		store:        store,
		FRONTEND_URL: FRONTEND_URL,
	}
}

type createWorkspaceInput struct {
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	IsPrivate bool   `json:"is_private"`
}

type editWorkspaceInput struct {
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	IsPrivate bool   `json:"is_private"`
}

// create workspace
func (h *WorkspaceHandler) CreateWorkspace(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized",
			"WS_001", "invalid user")
		return
	}
	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid user id",
			"WS_002", "invalid user ID")
		return
	}
	var req createWorkspaceInput

	if err := response.Read(r, &req); err != nil {
		response.BadRequest(
			w,
			"CH_001",
			"invalid request body",
			"request body must be valid JSON",
		)
		return
	}

	newWorkspace, err := h.store.Queries.CreateWorkspace(r.Context(), db.CreateWorkspaceParams{
		Name:      req.Name,
		Slug:      req.Slug,
		IsPrivate: req.IsPrivate,
		CreatedBy: userUUID,
	})
	if err != nil {
		response.InternalServerError(
			w,
			"WS_005",
			"failed to create new workspace",
			err.Error(),
		)
		return
	}
	// add creator as owner
	_ = h.store.Queries.AddWorkspaceMember(r.Context(), db.AddWorkspaceMemberParams{
		WorkspaceID: newWorkspace.ID,
		UserID:      userUUID,
		Role:        "owner",
	})

	response.Created(w, "workspace created", newWorkspace)

}

// join workspace
func (h *WorkspaceHandler) JoinWorkspace(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized",
			"WS_001", "invalid user")
		return
	}
	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid user id",
			"WS_002", "invalid user ID")
		return
	}
	workspaceID := chi.URLParam(r, "workspaceID")
	workspaceUUID, err := pgutil.ParseToPGUUID(workspaceID)
	if err != nil {
		response.BadRequest(w, "WS_003", "invalid workspace ID",
			"workspace ID must be a valid UUID")
		return
	}
	workspace, err := h.store.Queries.GetWorkspaceByID(r.Context(), workspaceUUID)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"workspace not found",
			"WS_004",
			"no workspace with that id ",
		)
		return
	}

	if workspace.IsPrivate && workspace.IsPrivate {
		response.Error(w, http.StatusForbidden, "forbidden",
			"WS_004", "workspace is private")
		return
	}
	// 3. Verify workspace membership
	isMember, err := h.store.Queries.IsWorkspaceMember(r.Context(), db.IsWorkspaceMemberParams{
		WorkspaceID: workspaceUUID,
		UserID:      userUUID,
	})
	if err != nil {
		response.InternalServerError(w, "WS_004",
			"failed to verify workspace membership", err.Error())
		return
	}
	log.Println("hello")
	if isMember {
		response.Error(w, http.StatusForbidden, "forbidden",
			"WS_005", "you are already a member of this workspace")
		return
	}

	h.store.Queries.AddWorkspaceMember(r.Context(), db.AddWorkspaceMemberParams{
		WorkspaceID: workspaceUUID,
		UserID:      userUUID,
	})
	workspaceMembers, err := h.store.Queries.GetWorkspaceMembers(r.Context(), workspace.ID)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"fail to find workspace members",
			"WS_006",
			err.Error(),
		)
		return
	}
	response.Success(w, http.StatusOK, "joined workspace", map[string]any{
		"workspace":        workspace,
		"workspaceMembers": workspaceMembers,
	})
}

// searchworkspace
func (h *WorkspaceHandler) SearchWorkspace(w http.ResponseWriter, r *http.Request) {

	query := r.URL.Query()

	search := query.Get("search")

	page := 1
	if value := query.Get("page"); value != "" {
		p, err := strconv.Atoi(value)
		if err != nil || p < 1 {
			response.Error(w, http.StatusBadRequest, "invalid page",
				"WS_002", "page must be a positive integer")
			return
		}
		page = p
	}

	limit := 20
	if value := query.Get("limit"); value != "" {
		l, err := strconv.Atoi(value)
		if err != nil || l < 1 || l > 100 {
			response.Error(w, http.StatusBadRequest, "invalid limit",
				"WS_003", "limit must be between 1 and 100")
			return
		}
		limit = l
	}

	offset := (page - 1) * limit

	workspaces, err := h.store.Queries.SearchWorkspaces(r.Context(), db.SearchWorkspacesParams{
		Search:     search,
		PageLimit:  int32(limit),
		PageOffset: int32(offset),
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "internal server error",
			"WS_004", "failed to search workspaces")
		return
	}

	response.Success(w, http.StatusOK, "Workspaces fetched", map[string]any{
		"workspaces": workspaces,
		"pagination": map[string]any{
			"page":  page,
			"limit": limit,
		},
	})
}

// edit workspace
func (h *WorkspaceHandler) EditWorkspace(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"WS_001",
			"invalid user",
		)
		return
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"WS_002",
			"invalid user ID",
		)
		return
	}

	workspaceID := chi.URLParam(r, "workspaceID")

	workspaceUUID, err := pgutil.ParseToPGUUID(workspaceID)
	if err != nil {
		response.BadRequest(
			w,
			"WS_003",
			"invalid workspace ID",
			"workspace ID must be a valid UUID",
		)
		return
	}

	var req editWorkspaceInput

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(
			w,
			"WS_004",
			"invalid request body",
			"request body must contain valid JSON",
		)
		return
	}

	workspace, err := h.store.Queries.GetWorkspaceByID(
		r.Context(),
		workspaceUUID,
	)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"workspace not found",
			"WS_005",
			"no workspace with that id",
		)
		return
	}

	if workspace.CreatedBy != userUUID {
		response.Error(
			w,
			http.StatusForbidden,
			"forbidden",
			"WS_006",
			"user is not authorized to edit this workspace",
		)
		return
	}

	newWorkspace, err := h.store.Queries.EditWorkspace(
		r.Context(),
		db.EditWorkspaceParams{
			Name:      req.Name,
			Slug:      req.Slug,
			IsPrivate: req.IsPrivate,
			ID:        workspaceUUID,
			CreatedBy: userUUID,
		},
	)
	if err != nil {
		response.Error(
			w,
			http.StatusInternalServerError,
			"internal server error",
			"WS_007",
			"failed to edit workspace",
		)
		return
	}

	response.Success(
		w,
		http.StatusOK,
		"successfully edited workspace",
		newWorkspace,
	)
}

// delete workspace
func (h *WorkspaceHandler) DeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"WS_001",
			"invalid user",
		)
		return
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"WS_002",
			"invalid user ID",
		)
		return
	}

	workspaceID := chi.URLParam(r, "workspaceID")

	workspaceUUID, err := pgutil.ParseToPGUUID(workspaceID)
	if err != nil {
		response.BadRequest(
			w,
			"WS_003",
			"invalid workspace ID",
			"workspace ID must be a valid UUID",
		)
		return
	}
	workspace, err := h.store.Queries.GetWorkspaceByID(
		r.Context(),
		workspaceUUID,
	)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"workspace not found",
			"WS_005",
			"no workspace with that id",
		)
		return
	}
	if workspace.CreatedBy != userUUID {
		response.Error(
			w,
			http.StatusForbidden,
			"forbidden",
			"WS_006",
			"user is not authorized to delete this workspace",
		)
		return
	}

	err = h.store.Queries.DeleteWorkspace(
		r.Context(),
		db.DeleteWorkspaceParams{
			ID:        workspaceUUID,
			CreatedBy: userUUID,
		},
	)
	if err != nil {
		response.Error(
			w,
			http.StatusInternalServerError,
			"internal server error",
			"WS_007",
			"failed to delete workspace",
		)
		return
	}

	response.Success(
		w,
		http.StatusOK,
		"successfully deleted workspace",
		nil,
	)
}

// invite workspace
func (h *WorkspaceHandler) InviteInWorkspace(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"WS_001",
			"invalid user",
		)
		return
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"WS_002",
			"invalid user ID",
		)
		return
	}

	workspaceID := chi.URLParam(r, "workspaceID")

	workspaceUUID, err := pgutil.ParseToPGUUID(workspaceID)
	if err != nil {
		response.BadRequest(
			w,
			"WS_003",
			"invalid workspace ID",
			"workspace ID must be a valid UUID",
		)
		return
	}
	workspace, err := h.store.Queries.GetWorkspaceByID(r.Context(), workspaceUUID)
	if err != nil {
		response.Error(
			w,
			http.StatusNotFound,
			"workspace not found",
			"WS_004",
			"no workspace with that id",
		)
		return
	}
	if workspace.CreatedBy != userUUID {
		response.Error(
			w,
			http.StatusForbidden,
			"forbidden",
			"WS_005",
			"user is not authorized to invite members",
		)
		return
	}
	invite_code, err := generateInviteCode()
	if err != nil {
		response.BadRequest(
			w,
			"WS_006",
			"failed to generate code",
			err.Error(),
		)
		return
	}
	invite_expiry := time.Now().Add(1 * time.Hour)
	invite, err := h.store.Queries.GenerateWorkspaceInvite(r.Context(), db.GenerateWorkspaceInviteParams{
		InviteCode: pgtype.Text{
			String: string(invite_code),
			Valid:  true,
		},
		InviteExpiresAt: pgtype.Timestamptz{
			Time:  invite_expiry,
			Valid: true,
		},
		ID:        workspaceUUID,
		CreatedBy: userUUID,
	})
	if err != nil {
		response.BadRequest(
			w,
			"WS_006",
			"failed to create invite",
			err.Error(),
		)
		return
	}
	inviteLink := h.FRONTEND_URL + "/invite/" + invite_code
	response.Success(w, http.StatusAccepted, "Invite link created",
		map[string]any{
			"invite_code":       invite.InviteCode,
			"invite_expires_at": invite.InviteExpiresAt,
			"invite_link":       inviteLink,
		},
	)

}

func (h *WorkspaceHandler) AcceptInviteLink(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"WS_001",
			"invalid user",
		)
		return
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"WS_002",
			"invalid user ID",
		)
		return
	}

	Invite_Code := chi.URLParam(r, "invite_code")

	if Invite_Code == "" {
		response.BadRequest(
			w,
			"WS_003",
			"invite code is required",
			"invite_code must not be empty",
		)
		return
	}

	workspace, err := h.store.Queries.GetWorkspaceByInviteCode(r.Context(), pgtype.Text{
		String: string(Invite_Code),
		Valid:  true,
	})
	if err != nil {
		response.BadRequest(
			w,
			"WS_004",
			"failed to look up invite code",
			err.Error(),
		)
		return
	}
	if !workspace.ID.Valid {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid or expired invite code",
			"WS_005",
			"invite code is invalid or has expired",
		)
		return
	}

	workspaceMembers, err := h.store.Queries.GetWorkspaceMembers(r.Context(), workspace.ID)
	if err != nil {
		response.BadRequest(
			w,
			"WS_006",
			"failed to check workspace membership",
			err.Error(),
		)
		return
	}

	for _, v := range workspaceMembers {
		if v.ID == userUUID {
			response.Error(
				w,
				http.StatusBadRequest,
				"user already in workspace",
				"WS_007",
				"user is already a member of this workspace",
			)
			return
		}
	}

	if err := h.store.Queries.AddWorkspaceMember(r.Context(),
		db.AddWorkspaceMemberParams{
			WorkspaceID: workspace.ID,
			UserID:      userUUID,
			Role:        "member",
		}); err != nil {
		response.BadRequest(
			w,
			"WS_008",
			"failed to add user to workspace",
			err.Error(),
		)
		return
	}

	response.Success(
		w,
		http.StatusOK,
		"workspace joined successfully",
		map[string]any{
			"workspace": workspace,
			"role":      "member",
		},
	)

}

func (h *WorkspaceHandler) GetUserWorkspaces(w http.ResponseWriter, r *http.Request) {
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"WS_001",
			"invalid user",
		)
		return
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"WS_002",
			"invalid user ID",
		)
		return
	}
	workspace, err := h.store.Queries.GetWorkspacesByUser(r.Context(), userUUID)
	if err != nil {
		response.BadRequest(
			w,
			"WS_003",
			"failed to get user's workspace",
			err.Error(),
		)
		return
	}
	response.Success(
		w,
		http.StatusOK,
		"user workspaces fetched successfully",
		map[string]any{
			"workspaces": workspace,
		},
	)
}

func (h *WorkspaceHandler) GetWorkspaceBySlug(w http.ResponseWriter, r *http.Request) {
	// 1. Authenticate user from middleware context
	userID, _, ok := middleware.GetUserDetails(r)
	if !ok {
		response.Error(
			w,
			http.StatusUnauthorized,
			"unauthorized",
			"WS_001",
			"invalid or missing user session",
		)
		return
	}

	userUUID, err := pgutil.ParseToPGUUID(userID)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"WS_002",
			"invalid user ID",
		)
		return
	}

	// 2. Extract and validate path parameter
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		response.Error(
			w,
			http.StatusBadRequest,
			"bad request",
			"WS_003",
			"slug parameter is required",
		)
		return
	}

	// 3. Query workspace from store
	workspace, err := h.store.Queries.GetWorkspaceBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			response.Error(
				w,
				http.StatusNotFound,
				"not found",
				"WS_004",
				"workspace not found",
			)
			return
		}

		response.Error(
			w,
			http.StatusInternalServerError,
			"internal server error",
			"WS_005",
			"failed to fetch workspace",
		)
		return
	}

	// 4. Verify membership authorization
	isMember, err := h.store.Queries.IsWorkspaceMember(r.Context(), db.IsWorkspaceMemberParams{
		WorkspaceID: workspace.ID,
		UserID:      userUUID,
	})
	if err != nil {
		response.Error(
			w,
			http.StatusInternalServerError,
			"internal server error",
			"WS_006",
			"failed to verify workspace membership",
		)
		return
	}

	if !isMember {
		response.Error(
			w,
			http.StatusForbidden,
			"forbidden",
			"WS_007",
			"you are not a member of this workspace",
		)
		return
	}
	members, err := h.store.Queries.GetWorkspaceMembers(r.Context(), workspace.ID)
	if err != nil {
		response.InternalServerError(
			w,
			"CH_009",
			"failed to fetch channel members",
			err.Error(),
		)
		return
	}
	// 5. Return success response
	response.Success(
		w,
		http.StatusOK,
		"workspace fetched successfully",
		map[string]any{
			"workspace": workspace,
			"members":   members,
		},
	)
}

func generateInviteCode() (string, error) {
	b := make([]byte, 32)

	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}
