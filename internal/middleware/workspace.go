package middleware

import (
	"context"
	"net/http"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/pgutil"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/go-chi/chi"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	ContextWorkspaceUUID contextKey = "workspaceUUID"
	ContextUserUUID      contextKey = "userUUID"
)

// WorkspaceAuth verifies that the authenticated user is a member of the
// workspace in the URL, then injects both UUIDs into the request context.
// Mount this on any chi sub-router whose routes need workspace membership.
func WorkspaceAuth(queries *db.Queries) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			// 1. Parse workspace UUID from URL
			workspaceID := chi.URLParam(r, "workspaceID")
			workspaceUUID, err := pgutil.ParseToPGUUID(workspaceID)
			if err != nil {
				response.BadRequest(w, "CH_001", "invalid workspace ID",
					"workspace ID must be a valid UUID")
				return
			}

			// 2. Get authenticated user
			userID, _, ok := GetUserDetails(r)
			if !ok {
				response.Error(w, http.StatusUnauthorized, "unauthorized",
					"AUTH_001", "invalid user")
				return
			}
			userUUID, err := pgutil.ParseToPGUUID(userID)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "invalid user id",
					"AUTH_002", "invalid user ID")
				return
			}

			// 3. Verify workspace membership
			isMember, err := queries.IsWorkspaceMember(r.Context(), db.IsWorkspaceMemberParams{
				WorkspaceID: workspaceUUID,
				UserID:      userUUID,
			})
			if err != nil {
				response.InternalServerError(w, "CH_003",
					"failed to verify workspace membership", err.Error())
				return
			}
			if !isMember {
				response.Error(w, http.StatusForbidden, "forbidden",
					"CH_004", "you are not a member of this workspace")
				return
			}

			// 4. Inject into context and continue
			ctx := context.WithValue(r.Context(), ContextWorkspaceUUID, workspaceUUID)
			ctx = context.WithValue(ctx, ContextUserUUID, userUUID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Helpers so handlers never touch the raw keys directly

func WorkspaceUUIDFromCtx(ctx context.Context) (pgtype.UUID, bool) {
	v, ok := ctx.Value(ContextWorkspaceUUID).(pgtype.UUID)
	return v, ok
}

func UserUUIDFromCtx(ctx context.Context) (pgtype.UUID, bool) {
	v, ok := ctx.Value(ContextUserUUID).(pgtype.UUID)
	return v, ok
}
