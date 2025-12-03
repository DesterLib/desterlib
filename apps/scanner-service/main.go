package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func main() {
	// Load environment variables
	// Try loading from current directory first, then look in project root
	if err := godotenv.Load(); err != nil {
		// Try root .env (assuming apps/scanner-service structure)
		_ = godotenv.Load("../../.env")
	}

	// Initialize Logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.InfoLevel)

	// Setup configuration
	config, err := LoadConfig()
	if err != nil {
		logger.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := NewDatabase(config.DatabaseURL)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	redisClient, err := NewRedisClient(config.RedisURL)
	if err != nil {
		logger.Warnf("Failed to connect to Redis (continuing without cache/queue): %v", err)
	}
	if redisClient != nil {
		defer redisClient.Close()
	}

	// Initialize Scanner Service
	scanner := NewScannerService(db, redisClient, logger, config)

	// Setup HTTP server
	http.HandleFunc("/scan", scanner.ScanHandler)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// Start HTTP server in a goroutine
	go func() {
		addr := fmt.Sprintf(":%d", config.Port)
		logger.Infof("Scanner service listening on %s", addr)
		if err := http.ListenAndServe(addr, nil); err != nil {
			logger.Fatalf("HTTP server failed: %v", err)
		}
	}()

	fmt.Println("Scanner service started successfully")

	// Wait for interrupt signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	fmt.Println("Shutting down scanner service...")
}
