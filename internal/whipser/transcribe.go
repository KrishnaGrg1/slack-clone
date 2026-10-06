package whisper

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

type TranscribeService struct {
	whisperURL string
	httpClient *http.Client
}

func NewTranscribeService(whisperURL string) *TranscribeService {
	return &TranscribeService{
		whisperURL: whisperURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Minute,
		},
	}
}

func (ts *TranscribeService) TranscribeAudio(
	ctx context.Context,
	audio io.Reader,
	filename string,
) (string, error) {
	var buf bytes.Buffer

	w := multipart.NewWriter(&buf)

	part, err := w.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("create form file: %w", err)
	}

	if _, err := io.Copy(part, audio); err != nil {
		return "", fmt.Errorf("copy audio: %w", err)
	}

	if err := w.WriteField("response_format", "json"); err != nil {
		return "", fmt.Errorf("write response format: %w", err)
	}

	if err := w.WriteField("temperature", "0.0"); err != nil {
		return "", fmt.Errorf("write temperature: %w", err)
	}

	if err := w.Close(); err != nil {
		return "", fmt.Errorf("close multipart writer: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		ts.whisperURL,
		&buf,
	)
	if err != nil {
		return "", fmt.Errorf("create whisper request: %w", err)
	}

	req.Header.Set("Content-Type", w.FormDataContentType())

	resp, err := ts.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("whisper request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))

		return "", fmt.Errorf(
			"whisper returned %s: %s",
			resp.Status,
			strings.TrimSpace(string(body)),
		)
	}

	var out struct {
		Text string `json:"text"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("decode whisper response: %w", err)
	}

	return strings.TrimSpace(out.Text), nil
}
