package router

import (
	"log"
	"net/http"

	"github.com/KrishnaGrg1/slack-clone/internal/api/handler"
	"github.com/KrishnaGrg1/slack-clone/internal/config"
	"github.com/KrishnaGrg1/slack-clone/internal/hub"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/openrouter"
	"github.com/KrishnaGrg1/slack-clone/internal/queue"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/storage"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
)

func NewRouter(cfg *config.Config, store *store.Store, h *hub.Hub, ors *openrouter.OpenRouterService, storage *storage.StorageService, queue *queue.Queue) http.Handler {
	r := chi.NewRouter()
	r.Use(Logger)

	authHandler := handler.NewAuthHandler(store, cfg.JWT_SECRET)
	channelHandler := handler.NewChannelHandler(store)
	userHandler := handler.NewUserHandler(store)
	msgHandler := handler.NewMessageHandler(store, h)
	workspaceHandler := handler.NewWorkspaceHandler(store)
	callHandler := handler.NewCallHandler(store, ors, storage, queue)
	r.Route("/api/v1", func(r chi.Router) {

		// public
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			response.Success(w, http.StatusOK, "healthy", map[string]string{"status": "ok"})
		})
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
		})

		// protected — JWT required
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(cfg.JWT_SECRET))

			// WebSocket
			r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
				hub.ServeWs(h, store, w, r)
			})

			// current user
			r.Get("/user/me", userHandler.GetMe)

			// workspaces
			r.Route("/workspaces", func(r chi.Router) {
				r.Post("/", workspaceHandler.CreateWorkspace)
				r.Post("/{id}/join", workspaceHandler.JoinWorkspace)
			})

			// workspace-scoped routes
			r.Route("/workspaces/{workspaceID}", func(r chi.Router) {
				r.Use(middleware.WorkspaceAuth(store.Queries))

				// channels
				r.Get("/channels", channelHandler.GetChannels)
				r.Post("/channels", channelHandler.CreateChannel)

				r.Route("/channels/{id}", func(r chi.Router) {
					r.Get("/", channelHandler.GetChannel)
					r.Post("/join", channelHandler.JoinChannel)
					r.Delete("/leave", channelHandler.LeaveChannel)

					// messages — note param is {id} from parent, channelID here
					r.Get("/messages", msgHandler.GetMessages)
				})

				// message-level routes (edit, delete, thread)
				r.Route("/messages/{id}", func(r chi.Router) {
					r.Get("/thread", msgHandler.GetThread)
					r.Patch("/", msgHandler.EditMessage)
					r.Delete("/", msgHandler.DeleteMessage)
				})

				// calls
				r.Post("/calls/{id}/recording", callHandler.UploadRecording)
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
