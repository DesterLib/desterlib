import { Logger } from "@dester/logger";

/**
 * Token bucket rate limiter
 * Ensures we don't exceed TMDB's rate limit of 4 requests/second
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private lastRefill: number;
  private logger: Logger;

  constructor(requestsPerSecond: number, logger: Logger) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond;
    this.lastRefill = Date.now();
    this.logger = logger;
  }

  async acquire(): Promise<void> {
    while (this.tokens < 1) {
      this.refill();
      if (this.tokens < 1) {
        const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.refill();
    this.tokens -= 1;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}
