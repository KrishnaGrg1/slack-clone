package handler

import (
	"net/http"

	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
)

type UserHandler struct {
	store *store.Store
}

func NewUserHandler(store *store.Store) *UserHandler {
	return &UserHandler{
		store: store,
	}
}

func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userId, _, ok := middleware.GetUserDetails(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userUUID, err := pgutil.ParseToPGUUID(userId)
	if err != nil {
		response.Error(
			w,
			http.StatusUnauthorized,
			"invalid user id",
			"USER_001",
			"invalid user ID",
		)
		return
	}

	existingUser, err := h.store.Queries.GetUserByUserId(r.Context(),
		userUUID)
	if err != nil {
		response.InternalServerError(
			w,
			"USER_002",
			"failed to get User details",
			err.Error(),
		)
		return
	}
	response.Success(
		w,
		http.StatusOK,
		"User detail fetched",
		existingUser,
	)
}
