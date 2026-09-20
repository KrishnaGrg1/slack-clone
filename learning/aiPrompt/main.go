package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"

	openrouter "github.com/OpenRouterTeam/go-sdk"
	"github.com/OpenRouterTeam/go-sdk/models/components"
)

type OpenRouterService struct {
	openRouter *openrouter.OpenRouter
	model      string
}

func NewOpenRouterService(apiKey, model string) *OpenRouterService {
	return &OpenRouterService{
		openRouter: openrouter.New(
			openrouter.WithSecurity(apiKey),
		),
		model: model, // ✅ FIXED: Remember to assign the model!
	}
}

func (ors *OpenRouterService) SummarizeWithLLM(ctx context.Context, question string) (string, error) {
	res, err := ors.openRouter.Chat.Send(ctx, components.ChatRequest{
		Model: &ors.model,
		Messages: []components.ChatMessages{
			components.CreateChatMessagesUser(
				components.ChatUserMessage{
					Content: components.CreateChatUserMessageContentStr(
						question,
					),
					Role: components.ChatUserMessageRoleUser,
				},
			),
		},
	}, nil)

	if err != nil {
		return "", err
	}
	if res == nil || len(res.ChatResult.Choices) == 0 {
		return "", fmt.Errorf("empty response")
	}

	// 1. marshal union struct to raw json byte
	bytes, err := json.Marshal(res.ChatResult.Choices[0].Message.Content)
	if err != nil {
		return "", err
	}

	// 2. json byte to string
	var text string
	if err := json.Unmarshal(bytes, &text); err != nil {
		return "", err
	}
	return text, nil
}

func main() {
	ctx := context.Background()
	apiKey := ""
	model := ""

	if apiKey == "" || model == "" {
		fmt.Println("Error: Please set OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables.")
		return
	}

	ors := NewOpenRouterService(apiKey, model)
	fmt.Println("You can ask any question you like:")

	// ✅ FIX A: Using bufio.Scanner instead of Scanf allows reading multi-word sentences
	scanner := bufio.NewScanner(os.Stdin)
	if !scanner.Scan() {
		fmt.Println("Error reading input:", scanner.Err())
		return
	}
	question := scanner.Text()

	/*
		👉 NOTE: If you strictly HAD to use Scanf for a single word, it would look like this:
		var question string
		_, err := fmt.Scanf("%s\n", &question) // Notice the pointer '&' and capturing newline '\n'
		if err != nil { ... }
	*/

	// ✅ FIX B: Pass the 'question' string, not the return count from Scanf
	response, err := ors.SummarizeWithLLM(ctx, question)
	if err != nil {
		fmt.Println("Error getting summary:", err)
		return
	}

	fmt.Println("\nAI Response:")
	fmt.Println(response)
}
