import Redis from "ioredis";
import { logger } from "@dester/logger";
import { config } from "../../config/env";
import type { MetadataJob } from "../../domain/entities/metadata";

/**
 * Metadata Queue Service
 * Handles consuming metadata jobs from Redis queue
 */

export class MetadataQueueService {
  private redis: Redis;
  private queueName: string;
  private processingQueueName: string;
  private isConsuming: boolean = false;
  private isConnected: boolean = false;
  private lastErrorLogTime: number = 0;
  private errorLogInterval: number = 10000; // Log errors at most once every 10 seconds
  private maxRetries: number = 5;

  constructor(redisUrl: string, queueName: string) {
    this.queueName = queueName;
    this.processingQueueName = `${queueName}:processing`;

    // Create Redis client with error handling
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      showFriendlyErrorStack: false,
    });

    // Handle connection events
    this.redis.on("connect", () => {
      this.isConnected = true;
      this.lastErrorLogTime = 0;
      logger.info("Redis connected for metadata queue");
    });

    this.redis.on("ready", () => {
      this.isConnected = true;
      this.lastErrorLogTime = 0;
      logger.info("Redis ready for metadata queue");
    });

    this.redis.on("error", (error: Error) => {
      this.isConnected = false;

      // Throttle error logging
      const now = Date.now();
      const timeSinceLastLog = now - this.lastErrorLogTime;

      if (timeSinceLastLog >= this.errorLogInterval) {
        this.lastErrorLogTime = now;

        if (error.message.includes("ECONNREFUSED")) {
          logger.warn(
            { error: error.message },
            "Redis connection refused. Queue operations will be disabled. Start Redis with: docker-compose up redis or redis-server"
          );
        } else {
          logger.warn(
            { error: error.message },
            "Redis connection error. Queue operations may be disabled."
          );
        }
      }
    });

    this.redis.on("close", () => {
      this.isConnected = false;
      const now = Date.now();
      if (now - this.lastErrorLogTime >= this.errorLogInterval) {
        logger.warn("Redis connection closed");
        this.lastErrorLogTime = now;
      }
    });

    // Attempt to connect (non-blocking)
    this.redis.connect().catch((error: Error) => {
      this.lastErrorLogTime = Date.now();
      logger.warn(
        { error: error.message },
        "Failed to connect to Redis. Queue operations will be disabled. Start Redis with: docker-compose up redis or redis-server"
      );
    });
  }

  async close() {
    this.isConsuming = false;
    if (this.isConnected) {
      try {
        await this.redis.quit();
      } catch (error) {
        logger.warn({ error }, "Error closing Redis connection");
      }
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      this.isConnected = result === "PONG";
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Recovers orphaned jobs from the processing queue by moving them back to the main queue.
   * This should be called on startup.
   */
  async recover(): Promise<void> {
    if (!this.isConnected) return;

    try {
      logger.info("Checking for orphaned jobs in processing queue...");
      let count = 0;
      const maxRecovery = 10000;
      const logInterval = 100;

      let queueLength = await this.redis.llen(this.processingQueueName);

      if (queueLength === 0) {
        logger.info("No orphaned jobs found");
        return;
      }

      logger.info({ count: queueLength }, "Found orphaned jobs, recovering...");

      const startTime = Date.now();
      const timeoutMs = 30000;

      while (count < maxRecovery) {
        if (Date.now() - startTime > timeoutMs) {
          const remaining = await this.redis.llen(this.processingQueueName);
          logger.warn(
            { recovered: count, remaining },
            "Recovery timeout reached, stopping recovery"
          );
          break;
        }

        try {
          const item = await this.redis.rpoplpush(
            this.processingQueueName,
            this.queueName
          );

          if (!item) break;

          count++;

          if (count % logInterval === 0) {
            const remaining = await this.redis.llen(this.processingQueueName);
            logger.info({ count, remaining }, "Recovering orphaned jobs...");
          }
        } catch (error) {
          logger.error({ error, count }, "Error during recovery, stopping");
          break;
        }
      }

      if (count > 0) {
        logger.info({ count }, "Recovered orphaned jobs");

        if (count >= maxRecovery) {
          logger.warn(
            { recovered: count },
            "Recovery limit reached, some jobs may remain"
          );
        }
      }
    } catch (error) {
      logger.error({ error }, "Failed to recover orphaned jobs");
    }
  }

  /**
   * Consume jobs from the queue
   */
  async consume(
    processor: (job: MetadataJob) => Promise<void>,
    maxConcurrent: number = 4
  ) {
    if (!this.isConnected) {
      logger.warn(
        "Redis not connected. Queue consumer will not start. Start Redis with: docker-compose up redis or redis-server"
      );
      return;
    }

    // Recover orphaned jobs before starting consumption
    await this.recover();

    this.isConsuming = true;
    const semaphore = new Array(maxConcurrent).fill(null);
    let activeCount = 0;

    const processNext = async () => {
      if (!this.isConsuming) {
        return;
      }

      if (!this.isConnected) {
        logger.warn("Redis disconnected. Queue consumer paused.");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return processNext();
      }

      if (activeCount >= maxConcurrent) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return processNext();
      }

      let jobData: string | null = null;
      try {
        jobData = await this.redis.brpoplpush(
          this.queueName,
          this.processingQueueName,
          1
        );
      } catch (error) {
        logger.warn(
          { error: (error as Error).message },
          "Redis error while fetching job. Retrying..."
        );
        this.isConnected = false;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return processNext();
      }

      if (!jobData) {
        return processNext();
      }

      activeCount++;

      try {
        let job = JSON.parse(jobData);

        if (typeof job._retries === "undefined") {
          job._retries = 0;
        }

        logger.debug({ job, retries: job._retries }, "Processing metadata job");

        await processor(job);

        // Success: Remove from processing queue
        await this.redis.lrem(this.processingQueueName, 1, jobData);
      } catch (error) {
        logger.error({ error, jobData }, "Failed to process job");

        try {
          const job = JSON.parse(jobData);
          job._retries = (job._retries || 0) + 1;

          await this.redis.lrem(this.processingQueueName, 1, jobData);

          if (job._retries <= this.maxRetries) {
            const retryDelay = 5000 * Math.pow(2, job._retries - 1);
            logger.info(
              { retryDelay, retries: job._retries },
              "Scheduling retry for job"
            );

            setTimeout(() => {
              this.redis
                .lpush(this.queueName, JSON.stringify(job))
                .catch((err: Error) => {
                  logger.error({ error: err }, "Failed to requeue job");
                });
            }, retryDelay);
          } else {
            logger.error({ job }, "Max retries exceeded, dropping job");
          }
        } catch (e) {
          logger.error({ error: e }, "Critical error during error handling");
          await this.redis.lrem(this.processingQueueName, 1, jobData);
        }
      } finally {
        activeCount--;
      }

      processNext();
    };

    // Start multiple consumers
    for (let i = 0; i < maxConcurrent; i++) {
      processNext();
    }
  }
}
