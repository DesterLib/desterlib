package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client      *redis.Client
	ctx         context.Context
	isConnected bool
}

func NewRedisClient(redisURL string) (*RedisClient, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opt)
	ctx := context.Background()

	// Try to connect, but don't fail if Redis is unavailable
	// This allows the service to start even if Redis is not running
	rc := &RedisClient{
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

func (r *RedisClient) Close() error {
	return r.client.Close()
}

// IsConnected returns whether Redis is currently connected
func (r *RedisClient) IsConnected() bool {
	if !r.isConnected {
		// Try to reconnect
		if err := r.client.Ping(r.ctx).Err(); err == nil {
			r.isConnected = true
		}
	}
	return r.isConnected
}

// PushMetadataJob pushes a metadata job to the Redis queue
// Returns nil if Redis is not available (non-fatal)
func (r *RedisClient) PushMetadataJob(queueName string, job *MetadataJob) error {
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

