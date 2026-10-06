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

// func NewRouter(cfg *config.Config, store *store.Store, h *hub.Hub, ors *openrouter.OpenRouterService, storage *storage.StorageService, queue *queue.Queue) http.Handler {

func NewRouter(cfg *config.Config, store *store.Store, h *hub.Hub, callHandler *handler.CallHandler) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.CORS(cfg.FRONTEND_URL))
	r.Use(Logger)

	authHandler := handler.NewAuthHandler(store, cfg.JWT_SECRET)
	channelHandler := handler.NewChannelHandler(store)
	userHandler := handler.NewUserHandler(store)
	msgHandler := handler.NewMessageHandler(store, h)
	workspaceHandler := handler.NewWorkspaceHandler(store, cfg.FRONTEND_URL)
	// call recordings are handled through the workspace routes.

	r.Route("/api/v1", func(r chi.Router) {
		registerPublicRoutes(r, authHandler)
		registerProtectedRoutes(r, cfg.JWT_SECRET, store, h, userHandler, workspaceHandler, channelHandler, msgHandler, callHandler)
	})

	return r
}

func registerPublicRoutes(r chi.Router, authHandler *handler.AuthHandler) {
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		response.Success(w, http.StatusOK, "healthy", map[string]string{"status": "ok"})
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
	})
}

func registerProtectedRoutes(
	r chi.Router,
	jwtSecret string,
	store *store.Store,
	h *hub.Hub,
	userHandler *handler.UserHandler,
	workspaceHandler *handler.WorkspaceHandler,
	channelHandler *handler.ChannelHandler,
	msgHandler *handler.MessageHandler,
	callHandler *handler.CallHandler,
) {
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(jwtSecret))

		r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
			hub.ServeWs(h, store, w, r)
		})

		r.Get("/user/me", userHandler.GetMe)
		r.Post("/calls/{id}/recording", callHandler.UploadRecording)
		r.Route("/workspaces", func(r chi.Router) {
			r.Get("/search", workspaceHandler.SearchWorkspace)
			r.Post("/", workspaceHandler.CreateWorkspace)
			r.Get("/", workspaceHandler.GetUserWorkspaces)
			r.Post("/invite/{invite_code}/join", workspaceHandler.AcceptInviteLink)

			r.Get("/slug/{slug}", workspaceHandler.GetWorkspaceBySlug)

			r.Route("/{workspaceID}", func(r chi.Router) {
				r.Put("/", workspaceHandler.EditWorkspace)
				r.Post("/join", workspaceHandler.JoinWorkspace)
				r.Delete("/", workspaceHandler.DeleteWorkspace)
				r.Post("/invite", workspaceHandler.InviteInWorkspace)

				r.Group(func(r chi.Router) {
					r.Use(middleware.WorkspaceAuth(store.Queries))
					registerWorkspaceRoutes(r, channelHandler, msgHandler, callHandler)
				})
			})
		})
	})
}
func registerWorkspaceRoutes(
	r chi.Router,
	channelHandler *handler.ChannelHandler,
	msgHandler *handler.MessageHandler,
	callHandler *handler.CallHandler,
) {
	r.Get("/channels", channelHandler.GetChannels)
	r.Post("/channels", channelHandler.CreateChannel)

	r.Route("/channels/{id}", func(r chi.Router) {
		r.Get("/", channelHandler.GetChannel)
		r.Post("/join", channelHandler.JoinChannel)
		r.Delete("/leave", channelHandler.LeaveChannel)
		r.Get("/messages", msgHandler.GetMessages)
	})

	r.Route("/messages/{id}", func(r chi.Router) {
		r.Get("/thread", msgHandler.GetThread)
		r.Patch("/", msgHandler.EditMessage)
		r.Delete("/", msgHandler.DeleteMessage)
	})

	// calls
	// r.Post("/calls/{id}/recording", callHandler.UploadRecording)
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
