import { getRedisClient } from "./client";

export interface QueueOptions {
  name: string;
  maxRetries?: number;
  retryDelay?: number;
}

export class Queue {
  private client = getRedisClient();
  private name: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: QueueOptions) {
    this.name = options.name;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000;
  }

  async push(data: unknown): Promise<void> {
    await this.client.rpush(this.name, JSON.stringify(data));
  }

  async pop(): Promise<unknown | null> {
    const data = await this.client.blpop(this.name, 0);
    if (!data) return null;
    try {
      return JSON.parse(data[1]);
    } catch {
      return null;
    }
  }

  async length(): Promise<number> {
    return this.client.llen(this.name);
  }

  async clear(): Promise<void> {
    await this.client.del(this.name);
  }
}
