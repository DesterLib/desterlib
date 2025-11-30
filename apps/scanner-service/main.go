package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func main() {
	// Initialize logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	// Load .env file from project root
	// Get the current working directory
	wd, err := os.Getwd()
	if err != nil {
		wd = "."
	}

	// Try to find .env file
	// First try two levels up (when running from apps/scanner-service -> apps -> root)
	envPath := filepath.Join(wd, "..", "..", ".env")
	if _, err := os.Stat(envPath); err != nil {
		// If not found, try in current directory (when running from root)
		envPath = filepath.Join(wd, ".env")
	}

	// Load the .env file (ignore error if file doesn't exist)
	_ = godotenv.Load(envPath)

	// Load configuration
	cfg, err := LoadConfig()
	if err != nil {
		logger.Fatalf("Failed to load config: %v", err)
	}

	// Configure file logging if SCANNER_LOG_PATH is set
	if cfg.ScannerLogPath != "" {
		// Resolve log path relative to project root
		var logDir string
		if filepath.IsAbs(cfg.ScannerLogPath) {
			logDir = cfg.ScannerLogPath
		} else {
			// Resolve relative to project root (two levels up from scanner-service)
			logDir = filepath.Join(wd, "..", "..", cfg.ScannerLogPath)
		}

		// Ensure log directory exists
		if err := os.MkdirAll(logDir, 0755); err != nil {
			logger.Warnf("Failed to create log directory %s: %v. Logging to stdout only.", logDir, err)
		} else {
			// Create log file path
			logFile := filepath.Join(logDir, "scanner.log")
			file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
			if err != nil {
				logger.Warnf("Failed to open log file %s: %v. Logging to stdout only.", logFile, err)
			} else {
				// Set logrus to write to both file and stdout using MultiWriter
				multiWriter := io.MultiWriter(os.Stdout, file)
				logger.SetOutput(multiWriter)
				logger.Infof("Logging to file and stdout: %s", logFile)
			}
		}
	}

	// Initialize database
	db, err := NewDatabase(cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis client (optional - service can run without Redis)
	redisClient, err := NewRedisClient(cfg.RedisURL)
	if err != nil {
		logger.Warnf("Failed to initialize Redis client: %v. Queue operations will be disabled. Start Redis with: docker-compose up redis or redis-server", err)
		// Continue without Redis - scanning can still work, just won't queue metadata jobs
		redisClient = nil
	} else if !redisClient.IsConnected() {
		logger.Warn("Redis connection failed. Queue operations will be disabled. Start Redis with: docker-compose up redis or redis-server")
	} else {
		defer redisClient.Close()
		logger.Info("Redis connected successfully")
	}

	// Initialize scanner service
	scanner := NewScannerService(db, redisClient, logger, cfg)

	// Setup HTTP router
	router := mux.NewRouter()
	router.HandleFunc("/health", healthHandler).Methods("GET")
	router.HandleFunc("/scan", scanner.ScanHandler).Methods("POST")

	// Start HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	go func() {
		logger.Infof("Scanner service starting on port %d", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down scanner service...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Fatalf("Server forced to shutdown: %v", err)
	}

	logger.Info("Scanner service stopped")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

