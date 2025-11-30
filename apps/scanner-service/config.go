package main

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	Port            int
	DatabaseURL     string
	RedisURL        string
	WorkerCount     int
	FFProbePath     string
	FFProbeTimeout  time.Duration
	ScanQueueName   string
	MaxScanDepth    int
	VideoExtensions []string
	ScannerLogPath  string
}

func LoadConfig() (*Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	// Ensure sslmode=disable is set for local PostgreSQL connections
	// Go's pq driver requires explicit SSL mode
	if !strings.Contains(databaseURL, "sslmode=") {
		separator := "?"
		if strings.Contains(databaseURL, "?") {
			separator = "&"
		}
		databaseURL = databaseURL + separator + "sslmode=disable"
	}

	// FFProbe timeout: default 30 seconds for slow mounts (e.g., rclone)
	// Can be overridden with FFPROBE_TIMEOUT_SECONDS env var
	ffprobeTimeoutSeconds := getEnvInt("FFPROBE_TIMEOUT_SECONDS", 30)
	ffprobeTimeout := time.Duration(ffprobeTimeoutSeconds) * time.Second

	cfg := &Config{
		Port:            getEnvInt("SCANNER_PORT", 8080),
		DatabaseURL:     databaseURL,
		RedisURL:        getEnv("REDIS_URL", "redis://localhost:6379/0"),
		WorkerCount:     getEnvInt("SCANNER_WORKER_COUNT", 10),
		FFProbePath:     getEnv("FFPROBE_PATH", "ffprobe"),
		FFProbeTimeout:  ffprobeTimeout,
		ScanQueueName:   getEnv("SCAN_QUEUE_NAME", "metadata:jobs"),
		MaxScanDepth:    getEnvInt("SCANNER_MAX_DEPTH", 4),
		VideoExtensions: []string{".mkv", ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"},
		ScannerLogPath:  getEnv("SCANNER_LOG_PATH", ""), // Optional: if set, logs will be written to file
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var result int
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return defaultValue
}

