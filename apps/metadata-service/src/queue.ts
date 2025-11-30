import Redis from "ioredis";
import { Logger } from "@dester/logger";

export class RedisQueue {
  private redis: Redis;
  private queueName: string;
  private processingQueueName: string;
  private logger: Logger;
  private isConsuming: boolean = false;
  private isConnected: boolean = false;
  private lastErrorLogTime: number = 0;
  private errorLogInterval: number = 10000; // Log errors at most once every 10 seconds
  private maxRetries: number = 5;

  constructor(redisUrl: string, queueName: string, logger: Logger) {
    this.queueName = queueName;
    this.processingQueueName = `${queueName}:processing`;
    this.logger = logger;

    // Create Redis client with error handling
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
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
      this.lastErrorLogTime = 0; // Reset error log timer on successful connection
      this.logger.info("Redis connected");
    });

    this.redis.on("ready", () => {
      this.isConnected = true;
      this.lastErrorLogTime = 0; // Reset error log timer on ready
      this.logger.info("Redis ready");
    });

    this.redis.on("error", (error) => {
      this.isConnected = false;

      // Throttle error logging to avoid spam
      const now = Date.now();
      const timeSinceLastLog = now - this.lastErrorLogTime;

      if (timeSinceLastLog >= this.errorLogInterval) {
        this.lastErrorLogTime = now;

        if (error.message.includes("ECONNREFUSED")) {
          this.logger.warn(
            { error: error.message },
            "Redis connection refused. Queue operations will be disabled. Start Redis with: docker-compose up redis or redis-server"
          );
        } else {
          this.logger.warn(
            { error: error.message },
            "Redis connection error. Queue operations may be disabled."
          );
        }
      }
    });

    this.redis.on("close", () => {
      this.isConnected = false;
      // Only log close if we haven't logged an error recently
      const now = Date.now();
      if (now - this.lastErrorLogTime >= this.errorLogInterval) {
        this.logger.warn("Redis connection closed");
        this.lastErrorLogTime = now;
      }
    });

    // Attempt to connect (non-blocking)
    this.redis.connect().catch((error) => {
      this.lastErrorLogTime = Date.now();
      this.logger.warn(
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
        this.logger.warn({ error }, "Error closing Redis connection");
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
      this.logger.info("Checking for orphaned jobs in processing queue...");
      let count = 0;
      const maxRecovery = 10000; // Safety limit to prevent infinite loops
      const logInterval = 100; // Log progress every N jobs

      // Check queue length first (non-blocking)
      let queueLength = await this.redis.llen(this.processingQueueName);

      if (queueLength === 0) {
        this.logger.info("No orphaned jobs found");
        return;
      }

      this.logger.info(
        { count: queueLength },
        "Found orphaned jobs, recovering..."
      );

      // Move items from the tail of processing queue to the head of main queue
      // This recovers jobs that were being processed when the service crashed
      const startTime = Date.now();
      const timeoutMs = 30000; // 30 second total timeout

      while (count < maxRecovery) {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          const remaining = await this.redis.llen(this.processingQueueName);
          this.logger.warn(
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

          if (!item) break; // Queue is empty

          count++;

          // Log progress periodically
          if (count % logInterval === 0) {
            const remaining = await this.redis.llen(this.processingQueueName);
            this.logger.info(
              { count, remaining },
              "Recovering orphaned jobs..."
            );
          }
        } catch (error) {
          this.logger.error(
            { error, count },
            "Error during recovery, stopping"
          );
          break;
        }
      }

      if (count > 0) {
        this.logger.info({ count }, "Recovered orphaned jobs");

        if (count >= maxRecovery) {
          this.logger.warn(
            { recovered: count },
            "Recovery limit reached, some jobs may remain"
          );
        }
      }
    } catch (error) {
      this.logger.error({ error }, "Failed to recover orphaned jobs");
      // Don't throw - allow service to start even if recovery fails
    }
  }

  async consume(
    processor: (job: any) => Promise<void>,
    maxConcurrent: number = 4
  ) {
    // Check if Redis is connected before starting consumer
    if (!this.isConnected) {
      this.logger.warn(
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

      // Check connection before processing
      if (!this.isConnected) {
        this.logger.warn("Redis disconnected. Queue consumer paused.");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return processNext();
      }

      // Wait if we're at max concurrency
      if (activeCount >= maxConcurrent) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return processNext();
      }

      // Try to get a job from the queue using reliable queue pattern
      // atomic move from queue to processing queue
      let jobData: string | null = null;
      try {
        // brpoplpush is atomic: pops from source, pushes to destination, returns the element
        // If list is empty, blocks for timeout (1 second)
        jobData = await this.redis.brpoplpush(
          this.queueName,
          this.processingQueueName,
          1
        );
      } catch (error) {
        this.logger.warn(
          { error: (error as Error).message },
          "Redis error while fetching job. Retrying..."
        );
        this.isConnected = false;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return processNext();
      }

      if (!jobData) {
        // No job available (timeout), try again
        return processNext();
      }

      activeCount++;

      try {
        let job = JSON.parse(jobData);

        // Handle potentially missing retries count (first run)
        if (typeof job._retries === "undefined") {
          job._retries = 0;
        }

        this.logger.debug(
          { job, retries: job._retries },
          "Processing metadata job"
        );

        await processor(job);

        // Success: Remove from processing queue
        await this.redis.lrem(this.processingQueueName, 1, jobData);
      } catch (error) {
        this.logger.error({ error, jobData }, "Failed to process job");

        // Failure handling
        try {
          const job = JSON.parse(jobData);
          job._retries = (job._retries || 0) + 1;

          // Remove the failed job from processing queue
          // We will re-add it to the main queue (with delay) if it hasn't exceeded max retries
          await this.redis.lrem(this.processingQueueName, 1, jobData);

          if (job._retries <= this.maxRetries) {
            const retryDelay = 5000 * Math.pow(2, job._retries - 1); // Exponential backoff: 5s, 10s, 20s...
            this.logger.info(
              { retryDelay, retries: job._retries },
              "Scheduling retry for job"
            );

            setTimeout(() => {
              this.redis
                .lpush(this.queueName, JSON.stringify(job))
                .catch((err) => {
                  this.logger.error({ error: err }, "Failed to requeue job");
                });
            }, retryDelay);
          } else {
            this.logger.error({ job }, "Max retries exceeded, dropping job");
            // In a production system, you would push this to a Dead Letter Queue (DLQ)
            // await this.redis.lpush(`${this.queueName}:dlq`, JSON.stringify(job));
          }
        } catch (e) {
          this.logger.error(
            { error: e },
            "Critical error during error handling"
          );
          // Attempt to remove potentially bad data to avoid stuck queue if parsing failed
          await this.redis.lrem(this.processingQueueName, 1, jobData);
        }
      } finally {
        activeCount--;
      }

      // Process next job
      processNext();
    };

    // Start multiple consumers
    for (let i = 0; i < maxConcurrent; i++) {
      processNext();
    }
  }
}
