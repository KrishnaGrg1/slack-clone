package handler

import (
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/KrishnaGrg1/slack-clone/internal/openrouter"
	"github.com/KrishnaGrg1/slack-clone/internal/queue"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/storage"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/go-chi/chi"
	"github.com/hibiken/asynq"
)

type CallHandler struct {
	store   *store.Store
	ors     *openrouter.OpenRouterService
	storage *storage.StorageService
	queue   *queue.Queue
}

func NewCallHandler(store *store.Store, ors *openrouter.OpenRouterService, storage *storage.StorageService, queue *queue.Queue) *CallHandler {
	return &CallHandler{
		store:   store,
		ors:     ors,
		storage: storage,
		queue:   queue,
	}
}

// post /api/v1/calls/:id/recording

//formfile audio
//save temporarily
// queue to summarize it

func (c *CallHandler) UploadRecording(w http.ResponseWriter, r *http.Request) {
	callID := chi.URLParam(r, "id")

	// limit upload
	r.Body = http.MaxBytesReader(w, r.Body, 50<<20)

	// parseMultiform
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		response.Error(w, http.StatusBadRequest, "file too large", "CALL_001", err.Error())
		return
	}

	// file name as audio in frontend and get it
	file, fileHeader, err := r.FormFile("audio")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "audio file required", "CALL_002", err.Error())
		return
	}
	defer file.Close()

	// extract content type and file extension safely
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "audio/webm"
	}
	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		ext = ".webm"
	}

	//object name
	objectName := fmt.Sprintf("calls/%s/recoding%s", callID, ext)

	err = c.storage.UploadAudioStream(r.Context(), objectName, file, fileHeader.Size, contentType)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to store recording", "CALL_003", err.Error())
		return
	}
	task, err := queue.NewProcessRecordingTask(queue.RecordingPayload{
		CallID:     callID,
		ObjectName: objectName,
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to queue task", "CALL_004", err.Error())
		return
	}
	if err := c.queue.Enqueue(r.Context(), task, asynq.MaxRetry(3)); err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to enqueue task", "CALL_005", err.Error())
		return
	}
	response.Success(w, http.StatusAccepted, "recording received, processing", nil)
}
