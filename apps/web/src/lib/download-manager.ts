/**
 * Download Manager
 * Handles downloading media for offline viewing
 */

import type { Media } from "@dester/api-client";
import {
  saveDownloadedMedia,
  deleteDownloadedMedia,
  isMediaDownloaded,
  type DownloadedMedia,
} from "./offline-storage";

export interface DownloadProgress {
  mediaId: string;
  progress: number; // 0-100
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  error?: string;
}

type ProgressCallback = (progress: DownloadProgress) => void;

/**
 * Download media for offline viewing
 * This will download the video file, poster, and backdrop images
 */
export async function downloadMedia(
  media: Media,
  onProgress?: ProgressCallback
): Promise<void> {
  if (!media.id) {
    throw new Error("Media ID is required");
  }

  // Check if already downloaded
  const alreadyDownloaded = await isMediaDownloaded(media.id);
  if (alreadyDownloaded) {
    console.log(`Media ${media.id} is already downloaded`);
    return;
  }

  const mediaId = media.id;
  let totalSize = 0;
  let downloadedSize = 0;

  const updateProgress = (
    status: DownloadProgress["status"],
    error?: string
  ) => {
    const progress: DownloadProgress = {
      mediaId,
      progress:
        totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0,
      status,
      error,
    };
    onProgress?.(progress);
  };

  try {
    updateProgress("downloading");

    // Download video file
    let videoBlob: Blob | null = null;
    let posterBlob: Blob | null = null;
    let backdropBlob: Blob | null = null;

    // In a real implementation, you would fetch the actual video file
    // For now, this is a placeholder structure
    if (media.files && media.files.length > 0) {
      const videoFile = media.files[0];
      // TODO: Implement actual video download
      // const videoResponse = await fetch(videoFile.url);
      // videoBlob = await videoResponse.blob();
      // totalSize += videoBlob.size;
    }

    // Download poster image
    if (media.posterUrl) {
      try {
        const posterResponse = await fetch(media.posterUrl);
        posterBlob = await posterResponse.blob();
        totalSize += posterBlob.size;
        downloadedSize += posterBlob.size;
        updateProgress("downloading");
      } catch (err) {
        console.warn("Failed to download poster:", err);
      }
    }

    // Download backdrop image
    if (media.backdropUrl) {
      try {
        const backdropResponse = await fetch(media.backdropUrl);
        backdropBlob = await backdropResponse.blob();
        totalSize += backdropBlob.size;
        downloadedSize += backdropBlob.size;
        updateProgress("downloading");
      } catch (err) {
        console.warn("Failed to download backdrop:", err);
      }
    }

    // Create blob URLs for local access
    const localVideoPath = videoBlob
      ? URL.createObjectURL(videoBlob)
      : undefined;
    const localPosterPath = posterBlob
      ? URL.createObjectURL(posterBlob)
      : undefined;
    const localBackdropPath = backdropBlob
      ? URL.createObjectURL(backdropBlob)
      : undefined;

    // Save to IndexedDB
    const downloadedMedia: DownloadedMedia = {
      id: mediaId,
      media,
      downloadedAt: new Date().toISOString(),
      localVideoPath,
      localPosterPath,
      localBackdropPath,
      fileSize: totalSize,
    };

    await saveDownloadedMedia(downloadedMedia);
    updateProgress("completed");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    updateProgress("failed", errorMessage);
    throw error;
  }
}

/**
 * Remove downloaded media
 */
export async function removeDownloadedMedia(mediaId: string): Promise<void> {
  await deleteDownloadedMedia(mediaId);
}

/**
 * Check if media is available offline
 */
export async function isAvailableOffline(mediaId: string): Promise<boolean> {
  return await isMediaDownloaded(mediaId);
}

/**
 * Get download size estimate
 * Returns size in bytes (this is a rough estimate)
 */
export function getDownloadSizeEstimate(media: Media): number {
  let estimatedSize = 0;

  // Estimate video size based on duration and quality
  // Average bitrate assumptions: 720p ~5 Mbps, 1080p ~8 Mbps
  const durationInMinutes = (media.runtime || 90) / 60;
  const estimatedBitrateMbps = 6; // Average between 720p and 1080p
  const videoSizeMB = (durationInMinutes * estimatedBitrateMbps * 60) / 8;
  estimatedSize += videoSizeMB * 1024 * 1024;

  // Add ~500KB for poster and backdrop images
  estimatedSize += 500 * 1024;

  return estimatedSize;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
