/**
 * Scan Queue Service
 *
 * Manages scan queue to prevent overwhelming slow mounts
 */

import { logger } from "@/lib/utils";
import { wsManager } from "@/lib/websocket";

type ScanTask = () => Promise<void>;

class ScanQueueService {
  private activeScan: Promise<void> | null = null;
  private scanQueue: ScanTask[] = [];

  /**
   * Add a scan task to the queue or execute immediately if queue is empty
   */
  async enqueue(
    scanTask: ScanTask
  ): Promise<{ queued: boolean; queuePosition?: number }> {
    if (this.activeScan) {
      this.scanQueue.push(scanTask);
      logger.info(`📋 Scan queued (${this.scanQueue.length} in queue)`);
      return {
        queued: true,
        queuePosition: this.scanQueue.length,
      };
    }

    // Start scan immediately
    this.activeScan = scanTask().finally(() => {
      this.activeScan = null;
      this.processQueue(); // Process next in queue after this one completes
    });

    return { queued: false };
  }

  /**
   * Process the next item in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.activeScan) {
      logger.info("📋 Scan queued - another scan is in progress");
      return;
    }

    if (this.scanQueue.length === 0) return;

    const nextScan = this.scanQueue.shift()!;
    this.activeScan = nextScan().finally(() => {
      this.activeScan = null;
      this.processQueue(); // Process next in queue
    });
  }

  /**
   * Get current queue status
   */
  getStatus(): { active: boolean; queueLength: number } {
    return {
      active: this.activeScan !== null,
      queueLength: this.scanQueue.length,
    };
  }
}

export const scanQueueService = new ScanQueueService();
