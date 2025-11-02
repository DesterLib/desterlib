/**
 * Rate limiter for TMDB API calls
 * TMDB allows ~40 requests per 10 seconds
 */

export interface RateLimiter {
  add: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Creates a rate limiter for API calls
 * 
 * @param maxRequestsPer10Sec - Maximum requests allowed per 10 seconds (default: 38)
 * @param concurrency - Number of concurrent requests (default: 10)
 * @returns RateLimiter instance
 */
export function createRateLimiter(
  maxRequestsPer10Sec: number = 38,
  concurrency: number = 10
): RateLimiter {
  const queue: Array<() => Promise<void>> = [];
  let processing = false;
  let requestTimestamps: number[] = [];

  async function process() {
    if (processing) return;
    processing = true;

    while (queue.length > 0) {
      // Clean up old timestamps (older than 10 seconds)
      const now = Date.now();
      requestTimestamps = requestTimestamps.filter(
        (timestamp) => now - timestamp < 10000
      );

      // Calculate how many requests we can make right now
      const availableSlots = Math.max(
        0,
        maxRequestsPer10Sec - requestTimestamps.length
      );

      if (availableSlots === 0) {
        // Wait until the oldest timestamp expires
        const oldestTimestamp = requestTimestamps[0];
        if (oldestTimestamp) {
          const waitTime = 10000 - (now - oldestTimestamp) + 100; // +100ms buffer
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        continue;
      }

      // Take up to concurrency or available slots, whichever is smaller
      const batchSize = Math.min(concurrency, availableSlots, queue.length);
      const batch = queue.splice(0, batchSize);

      // Record timestamps for these requests
      for (let i = 0; i < batchSize; i++) {
        requestTimestamps.push(Date.now());
      }

      // Execute batch in parallel
      await Promise.all(batch.map((fn) => fn()));
    }

    processing = false;
  }

  return {
    add<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        process();
      });
    },
  };
}

