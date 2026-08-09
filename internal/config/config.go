package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DB_URL     string
	PORT       string
	JWT_SECRET string
	REDIS_URL  string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, using system env")
	}
	return &Config{
		DB_URL:     getEnv("GOOSE_DBSTRING", ""),
		PORT:       getEnv("PORT", "8080"),
		JWT_SECRET: getEnv("JWT_SECRET", ""),
		REDIS_URL:  getEnv("REDIS_URL", "redis://localhost:6379"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
