package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"
const UserNameKey contextKey = "userName"

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// get token from Authorization: Bearer <token>
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Unauthorized(w, "AUTH_001", "missing token", "authorization header required")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				response.Unauthorized(w, "AUTH_002", "invalid token format", "use: Bearer <token>")
				return
			}

			tokenStr := parts[1]

			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				response.Unauthorized(w, "AUTH_003", "invalid token", "token is expired or invalid")
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				response.Unauthorized(w, "AUTH_004", "invalid token claims", "could not parse claims")
				return
			}

			userID, ok := claims["sub"].(string)
			if !ok || userID == "" {
				response.Unauthorized(w, "AUTH_005", "invalid token subject", "missing user ID in token")
				return
			}

			userName, ok := claims["userName"].(string)
			if !ok || userName == "" {
				response.Unauthorized(w, "AUTH_006", "invalid token subject", "missing userName in token")
				return
			}
			// attach userID to request context
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserNameKey, userName)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserDetails extracts userID and userName from context — use this in handlers
func GetUserDetails(r *http.Request) (string, string, bool) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	userName, ok := r.Context().Value(UserNameKey).(string)
	return userID, userName, ok
}
