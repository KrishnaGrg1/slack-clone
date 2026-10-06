package middleware

import (
	"net/http"
	"strings"
)

// CORS allows the frontend origin to call the API with credentials.
// It also answers preflight requests before auth middleware runs.
func CORS(allowedOrigin string) func(http.Handler) http.Handler {
	allowedOrigin = strings.TrimRight(strings.TrimSpace(allowedOrigin), "/")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := strings.TrimRight(strings.TrimSpace(r.Header.Get("Origin")), "/")
			if origin != "" && (allowedOrigin == "" || origin == allowedOrigin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin, X-Requested-With")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
