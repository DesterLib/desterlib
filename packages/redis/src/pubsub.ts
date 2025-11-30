import { getRedisClient } from "./client";

export class PubSub {
  private publisher = getRedisClient();
  private subscriber = getRedisClient().duplicate();

  async publish(channel: string, message: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(
    channel: string,
    callback: (message: unknown) => void
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on("message", (ch, msg) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(msg));
        } catch {
          callback(msg);
        }
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }
}
