package redis

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
	"github.com/dester/go-service/models"
)

// Client provides Redis operations
type Client struct {
	client      *redis.Client
	ctx         context.Context
	isConnected bool
}

// New creates a new Redis client
// Returns nil error even if Redis is unavailable (non-fatal)
func New(redisURL string) (*Client, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opt)
	ctx := context.Background()

	// Try to connect, but don't fail if Redis is unavailable
	// This allows the service to start even if Redis is not running
	rc := &Client{
		client:      client,
		ctx:         ctx,
		isConnected: false,
	}

	// Test connection (non-blocking)
	if err := client.Ping(ctx).Err(); err != nil {
		// Redis is not available, but we'll continue anyway
		// The service can still scan files and save to database
		return rc, nil
	}

	rc.isConnected = true
	return rc, nil
}

// Close closes the Redis connection
func (r *Client) Close() error {
	return r.client.Close()
}

// IsConnected returns whether Redis is currently connected
func (r *Client) IsConnected() bool {
	if !r.isConnected {
		// Try to reconnect
		if err := r.client.Ping(r.ctx).Err(); err == nil {
			r.isConnected = true
		}
	}
	return r.isConnected
}

// PushMetadataJob pushes a metadata job to the Redis queue
// Returns error if Redis is not available (non-fatal)
func (r *Client) PushMetadataJob(queueName string, job *models.MetadataJob) error {
	if !r.IsConnected() {
		// Redis is not available, but this is not a fatal error
		// The scan can still complete and save to database
		return fmt.Errorf("Redis is not connected")
	}

	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	if err := r.client.LPush(r.ctx, queueName, data).Err(); err != nil {
		// Mark as disconnected on error
		r.isConnected = false
		return fmt.Errorf("failed to push job to queue: %w", err)
	}

	return nil
}

