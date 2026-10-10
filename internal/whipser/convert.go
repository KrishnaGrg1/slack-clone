package whisper

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
)

func ConvertToWav16k(ctx context.Context, inPath string) (string, error) {
	outPath := strings.TrimSuffix(inPath, filepath.Ext(inPath)) + ".16k.wav"
	cmd := exec.CommandContext(ctx, "ffmpeg", "-y", "-i", inPath,
		"-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", outPath)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("ffmpeg: %w: %s", err, stderr.String())
	}
	return outPath, nil
}
