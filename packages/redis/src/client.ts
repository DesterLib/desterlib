import Redis from "ioredis";

let redisClient: Redis | null = null;

export function createRedisClient(url?: string): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(
    url || process.env.REDIS_URL || "redis://localhost:6379",
    {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    }
  );

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redisClient.on("connect", () => {
    console.log("Redis Client Connected");
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

export function closeRedisClient(): Promise<string> {
  if (redisClient) {
    const client = redisClient;
    redisClient = null;
    return client.quit();
  }
  return Promise.resolve("OK");
}
