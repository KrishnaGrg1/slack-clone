package response

import (
	"encoding/json"
	"net/http"
)

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}
type Response struct {
	Success bool      `json:"success"`
	Message string    `json:"message,omitempty"`
	Data    any       `json:"data,omitempty"`
	Error   *APIError `json:"error,omitempty"`
}

func Read(r *http.Request, data any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(data)
}

func writeJSON(w http.ResponseWriter, status int, resp Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func Success(w http.ResponseWriter, status int, message string, data any) {
	writeJSON(w, status, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Created(w http.ResponseWriter, message string, data any) {
	Success(w, http.StatusCreated, message, data)
}

func Error(w http.ResponseWriter, status int, code, message, details string) {
	writeJSON(w, status, Response{
		Success: false,
		Message: message,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

func BadRequest(w http.ResponseWriter, code, message, details string) {
	Error(w, http.StatusBadRequest, code, message, details)
}

func Unauthorized(w http.ResponseWriter, code, message, details string) {
	Error(w, http.StatusUnauthorized, code, message, details)
}

func Conflict(w http.ResponseWriter, code, message, details string) {
	Error(w, http.StatusConflict, code, message, details)
}

func InternalServerError(w http.ResponseWriter, code, message, details string) {
	Error(w, http.StatusInternalServerError, code, message, details)
}
