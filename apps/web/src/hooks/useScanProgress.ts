/**
 * Hook to track scan progress via WebSocket notifications
 */

import { useState } from "react";
import { useWebSocketEvent } from "./useWebSocket";

export interface ScanProgress {
  libraryName: string;
  status: "started" | "progress" | "completed" | "failed";
  message: string;
  data?: {
    path?: string;
    mediaType?: string;
    collectionName?: string;
    totalFiles?: number;
    stats?: {
      added: number;
      updated: number;
      skipped: number;
    };
  };
  timestamp: string;
}

export function useScanProgress() {
  const [activeScan, setActiveScan] = useState<ScanProgress | null>(null);

  // Listen to notification events
  useWebSocketEvent("notification", (data: unknown) => {
    const notification = data as {
      type: string;
      status: string;
      message: string;
      data?: Record<string, unknown>;
      timestamp: string;
    };

    // Only process scan notifications
    if (notification.type === "scan") {
      const progress: ScanProgress = {
        libraryName:
          (notification.data?.collectionName as string) ||
          (notification.data?.path as string)?.split("/").pop() ||
          "Unknown Library",
        status: notification.status as ScanProgress["status"],
        message: notification.message,
        data: notification.data as ScanProgress["data"],
        timestamp: notification.timestamp,
      };

      setActiveScan(progress);

      // Auto-clear after completion or failure
      if (
        notification.status === "completed" ||
        notification.status === "failed"
      ) {
        setTimeout(() => {
          setActiveScan(null);
        }, 5000);
      }
    }
  });

  // Listen to specific notification status events
  useWebSocketEvent("notification:started", (data: unknown) => {
    const notification = data as {
      type: string;
      message: string;
      data?: Record<string, unknown>;
      timestamp: string;
    };

    if (notification.type === "scan") {
      const progress: ScanProgress = {
        libraryName:
          (notification.data?.collectionName as string) ||
          (notification.data?.path as string)?.split("/").pop() ||
          "Unknown Library",
        status: "started",
        message: notification.message,
        data: notification.data as ScanProgress["data"],
        timestamp: notification.timestamp,
      };

      setActiveScan(progress);
    }
  });

  useWebSocketEvent("notification:progress", (data: unknown) => {
    const notification = data as {
      type: string;
      message: string;
      data?: Record<string, unknown>;
      timestamp: string;
    };

    if (notification.type === "scan") {
      const progress: ScanProgress = {
        libraryName:
          (notification.data?.collectionName as string) ||
          (notification.data?.path as string)?.split("/").pop() ||
          "Unknown Library",
        status: "progress",
        message: notification.message,
        data: notification.data as ScanProgress["data"],
        timestamp: notification.timestamp,
      };

      setActiveScan(progress);
    }
  });

  useWebSocketEvent("notification:completed", (data: unknown) => {
    const notification = data as {
      type: string;
      message: string;
      data?: Record<string, unknown>;
      timestamp: string;
    };

    if (notification.type === "scan") {
      const progress: ScanProgress = {
        libraryName:
          (notification.data?.collectionName as string) ||
          (notification.data?.path as string)?.split("/").pop() ||
          "Unknown Library",
        status: "completed",
        message: notification.message,
        data: notification.data as ScanProgress["data"],
        timestamp: notification.timestamp,
      };

      setActiveScan(progress);

      // Auto-clear after 5 seconds
      setTimeout(() => {
        setActiveScan(null);
      }, 5000);
    }
  });

  useWebSocketEvent("notification:error", (data: unknown) => {
    const notification = data as {
      type: string;
      message: string;
      data?: Record<string, unknown>;
      timestamp: string;
    };

    if (notification.type === "scan") {
      const progress: ScanProgress = {
        libraryName:
          (notification.data?.collectionName as string) ||
          (notification.data?.path as string)?.split("/").pop() ||
          "Unknown Library",
        status: "failed",
        message: notification.message,
        data: notification.data as ScanProgress["data"],
        timestamp: notification.timestamp,
      };

      setActiveScan(progress);

      // Auto-clear after 5 seconds
      setTimeout(() => {
        setActiveScan(null);
      }, 5000);
    }
  });

  return {
    activeScan,
    isScanning:
      activeScan?.status === "started" || activeScan?.status === "progress",
    clearScan: () => setActiveScan(null),
  };
}
