/**
 * React Hook for Backup Progress Tracking
 *
 * Listens to WebSocket events for real-time backup progress updates
 */

import { useState, useEffect } from "react";
import { webSocketClient, WS_EVENTS } from "@/lib/websocket";

export interface BackupProgress {
  filename: string;
  type?: string;
  status: "idle" | "starting" | "in_progress" | "completed" | "error";
  bytesWritten?: number;
  size?: number;
  verified?: boolean;
  error?: string;
  timestamp: string;
}

export function useBackupProgress() {
  const [progress, setProgress] = useState<BackupProgress>({
    filename: "",
    status: "idle",
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    // Connect to WebSocket if not already connected
    webSocketClient.connect();

    // Handler for backup started
    const handleBackupStarted = (data: unknown) => {
      const backupData = data as {
        data: { filename: string; type: string; status: string };
      };
      console.log("Backup started:", backupData);
      setProgress({
        filename: backupData.data.filename,
        type: backupData.data.type,
        status: "starting",
        timestamp: new Date().toISOString(),
      });
    };

    // Handler for backup progress
    const handleBackupProgress = (data: unknown) => {
      const backupData = data as {
        data: { filename: string; bytesWritten: number; status: string };
      };
      console.log("Backup progress:", backupData);
      setProgress((prev) => ({
        ...prev,
        filename: backupData.data.filename,
        bytesWritten: backupData.data.bytesWritten,
        status: "in_progress",
        timestamp: new Date().toISOString(),
      }));
    };

    // Handler for backup completed
    const handleBackupCompleted = (data: unknown) => {
      const backupData = data as {
        data: {
          filename: string;
          size: number;
          type: string;
          verified: boolean;
          status: string;
        };
      };
      console.log("Backup completed:", backupData);
      setProgress({
        filename: backupData.data.filename,
        type: backupData.data.type,
        size: backupData.data.size,
        verified: backupData.data.verified,
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setProgress({
          filename: "",
          status: "idle",
          timestamp: new Date().toISOString(),
        });
      }, 5000);
    };

    // Handler for backup error
    const handleBackupError = (data: unknown) => {
      const backupData = data as {
        data: { filename: string; error: string; status: string };
      };
      console.error("Backup error:", backupData);
      setProgress({
        filename: backupData.data.filename,
        error: backupData.data.error,
        status: "error",
        timestamp: new Date().toISOString(),
      });

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setProgress({
          filename: "",
          status: "idle",
          timestamp: new Date().toISOString(),
        });
      }, 5000);
    };

    // Subscribe to backup events
    webSocketClient.on(WS_EVENTS.BACKUP_STARTED, handleBackupStarted);
    webSocketClient.on(WS_EVENTS.BACKUP_PROGRESS, handleBackupProgress);
    webSocketClient.on(WS_EVENTS.BACKUP_COMPLETED, handleBackupCompleted);
    webSocketClient.on(WS_EVENTS.BACKUP_ERROR, handleBackupError);

    // Cleanup listeners on unmount
    return () => {
      webSocketClient.off(WS_EVENTS.BACKUP_STARTED, handleBackupStarted);
      webSocketClient.off(WS_EVENTS.BACKUP_PROGRESS, handleBackupProgress);
      webSocketClient.off(WS_EVENTS.BACKUP_COMPLETED, handleBackupCompleted);
      webSocketClient.off(WS_EVENTS.BACKUP_ERROR, handleBackupError);
    };
  }, []);

  return progress;
}
