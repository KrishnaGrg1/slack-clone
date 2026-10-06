package openrouter

import (
	"context"
	"encoding/json"
	"fmt"

	openrouter "github.com/OpenRouterTeam/go-sdk"
	"github.com/OpenRouterTeam/go-sdk/models/components"
)

type OpenRouterService struct {
	openRouter *openrouter.OpenRouter
	model      string
	sptmodel   string
}

func NewOpenRouterService(apiKey, model, sptmodel string) *OpenRouterService {
	return &OpenRouterService{
		openRouter: openrouter.New(
			openrouter.WithSecurity(apiKey),
		),
		model:    model,
		sptmodel: model,
	}
}

func extractText(content any) (string, error) {
	b, err := json.Marshal(content)
	if err != nil {
		return "", fmt.Errorf("marshal content: %w", err)
	}
	var text string
	if err := json.Unmarshal(b, &text); err != nil {
		return string(b), nil
	}
	return text, nil
}

func (ors *OpenRouterService) SummarizeHuddle(ctx context.Context, transcript string) (string, error) {
	res, err := ors.openRouter.Chat.Send(ctx, components.ChatRequest{
		Model: &ors.model,
		Messages: []components.ChatMessages{
			components.CreateChatMessagesSystem(
				components.ChatSystemMessage{
					Content: components.CreateChatSystemMessageContentStr(HuddleSystemPrompt),
					Role:    components.ChatSystemMessageRoleSystem,
				},
			),
			components.CreateChatMessagesUser(
				components.ChatUserMessage{
					Content: components.CreateChatUserMessageContentStr(transcript),
					Role:    components.ChatUserMessageRoleUser,
				},
			),
		},
	}, nil)
	if err != nil {
		return "", err
	}
	if res == nil || len(res.ChatResult.Choices) == 0 {
		return "", fmt.Errorf("empty response from OpenRouter")
	}
	return extractText(res.ChatResult.Choices[0].Message.Content)
}

// func (ors *OpenRouterService) TranscribeAudio(ctx context.Context, audioPath string) (string, error) {
// 	audioBytes, err := os.ReadFile(audioPath)
// 	if err != nil {
// 		return "", fmt.Errorf("read audio file: %w", err)
// 	}

// 	res, err := ors.openRouter.STT.CreateTranscription(ctx, components.STTRequest{
// 		Model: ors.sptmodel,
// 		InputAudio: components.STTInputAudio{
// 			Data: base64.StdEncoding.EncodeToString(audioBytes),
// 			// Format: ".webm",
// 			Format: "wav",
// 		},
// 	})
// 	if err != nil {
// 		return "", fmt.Errorf("transcription request: %w", err)
// 	}
// 	if res == nil {
// 		return "", fmt.Errorf("empty transcription response")
// 	}
// 	return res.Text, nil
// }
