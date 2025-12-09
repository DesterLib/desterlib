package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/dester/go-service/config"
	"github.com/dester/go-service/handlers"
	"github.com/dester/go-service/internal/database"
	"github.com/dester/go-service/internal/redis"
	"github.com/dester/go-service/services/scanner"
	"github.com/sirupsen/logrus"
)

func main() {
	// Load environment variables
	// Try loading from current directory first, then look in project root
	if err := godotenv.Load(); err != nil {
		// Try root .env (assuming apps/go-service structure)
		_ = godotenv.Load("../../.env")
	}

	// Initialize Logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.InfoLevel)

	// Setup configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	redisClient, err := redis.New(cfg.RedisURL)
	if err != nil {
		logger.Warnf("Failed to connect to Redis (continuing without cache/queue): %v", err)
	}
	if redisClient != nil {
		defer redisClient.Close()
	}

	// Initialize Scanner Service
	scannerService := scanner.New(db, redisClient, logger, cfg)

	// Setup HTTP server
	http.HandleFunc("/scan", handlers.ScanHandler(scannerService, logger))
	http.HandleFunc("/health", handlers.HealthHandler)

	// Start HTTP server in a goroutine
	go func() {
		addr := fmt.Sprintf(":%d", cfg.Port)
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

