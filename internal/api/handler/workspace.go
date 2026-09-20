package handler

import (
	"net/http"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
)

type WorkspaceHandler struct {
	store *store.Store
}

func NewWorkspaceHandler(store *store.Store) *WorkspaceHandler {
	return &WorkspaceHandler{
		store: store,
	}
}

type createWorkspaceInput struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

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
	workspaceID := chi.URLParam(r, "id")
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
