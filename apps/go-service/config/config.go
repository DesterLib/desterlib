package config

import (
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"
)

// Config holds all configuration for the service
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
	ScannerLogPath  string // TODO: Implement file logging when this is set (currently unused)
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	// Convert SQLite file: URLs to format expected by modernc.org/sqlite driver
	// The driver accepts: file path, file:/path, or sqlite:/path
	if strings.HasPrefix(databaseURL, "file:") {
		// Remove "file:" prefix
		path := strings.TrimPrefix(databaseURL, "file:")
		// Handle URL-encoded paths (e.g., file:/Users/alken/Library/Application%20Support/...)
		// Use PathUnescape which is designed for path components
		if decoded, err := url.PathUnescape(path); err == nil {
			path = decoded
		}
		// modernc.org/sqlite accepts file: protocol or just the path
		// Use the path directly (driver will handle it)
		databaseURL = path
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
		ScannerLogPath:  getEnv("SCANNER_LOG_PATH", ""), // TODO: Implement file logging when set
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

