package router

import (
	"log"
	"net/http"

	"github.com/KrishnaGrg1/slack-clone/internal/api/handler"
	"github.com/KrishnaGrg1/slack-clone/internal/config"
	"github.com/KrishnaGrg1/slack-clone/internal/hub"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
)

func NewRouter(cfg *config.Config, store *store.Store, h *hub.Hub) http.Handler {
	_ = cfg
	_ = store
	r := chi.NewRouter()
	r.Use(Logger)

	authHandler := handler.NewAuthHandler(store, cfg.JWT_SECRET)
	channelHandler := handler.NewChannelHandler(store)
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			response.Success(w, http.StatusOK, "Health is good", map[string]string{"status": "ok"})
		})
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
		})
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(cfg.JWT_SECRET))
			r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
				hub.ServeWs(h, w, r)
			})
			r.Route("/channels", func(r chi.Router) {
				r.Post("/", channelHandler.CreateChannel)
			})
		})
	})
	return r
}
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
