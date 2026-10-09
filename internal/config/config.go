package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DB_URL             string
	PORT               string
	JWT_SECRET         string
	REDIS_URL          string
	OPENROUTER_API_KEY string
	OPENROUTER_MODEL   string

	WHISPER_URL string

	OPENROUTER_AUDIO_MODEL string
	FRONTEND_URL           string

	MINIO_URL             string
	MINIO_ACESSKEY        string
	MINIO_SECRET_ACESSKEY string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, using system env")
	}
	return &Config{
		DB_URL:                 getEnv("GOOSE_DBSTRING", ""),
		PORT:                   getEnv("PORT", "8080"),
		JWT_SECRET:             getEnv("JWT_SECRET", ""),
		REDIS_URL:              getEnv("REDIS_URL", "redis://localhost:6379"),
		OPENROUTER_API_KEY:     getEnv("OPENROUTER_API_KEY", ""),
		OPENROUTER_MODEL:       getEnv("OPENROUTER_MODEL", ""),
		WHISPER_URL:            getEnv("WHISPER_URL", "http://localhost:8080/inference"),
		OPENROUTER_AUDIO_MODEL: getEnv("OPENROUTER_AUDIO_MODEL", ""),
		FRONTEND_URL:           getEnv("FRONTEND_URL", ""),
		MINIO_URL:              getEnv("MINIO_URL", "localhost:9000"),
		MINIO_ACESSKEY:         getEnv("MINIO_ACCESSKEY", "minioadmin"),
		MINIO_SECRET_ACESSKEY:  getEnv("MINIO_SECRET_ACCESSKEY", "minioadmin"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
