/**
 * Offline Storage Utilities
 * Handles local storage of downloaded media for offline viewing
 */

import type { Media } from "@dester/api-client";

const DB_NAME = "dester_offline";
const DB_VERSION = 1;
const MEDIA_STORE = "downloaded_media";
const METADATA_STORE = "media_metadata";

export interface DownloadedMedia {
  id: string;
  media: Media;
  downloadedAt: string;
  localVideoPath?: string; // For blob URLs or local file references
  localPosterPath?: string;
  localBackdropPath?: string;
  fileSize?: number;
}

/**
 * Initialize IndexedDB for offline storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        const metadataStore = db.createObjectStore(METADATA_STORE, {
          keyPath: "id",
        });
        metadataStore.createIndex("type", "type", { unique: false });
        metadataStore.createIndex("downloadedAt", "downloadedAt", {
          unique: false,
        });
      }
    };
  });
}

/**
 * Save downloaded media to IndexedDB
 */
export async function saveDownloadedMedia(
  media: DownloadedMedia
): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([METADATA_STORE], "readwrite");
  const store = transaction.objectStore(METADATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.put(media);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all downloaded media
 */
export async function getAllDownloadedMedia(): Promise<DownloadedMedia[]> {
  const db = await openDB();
  const transaction = db.transaction([METADATA_STORE], "readonly");
  const store = transaction.objectStore(METADATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get downloaded media by ID
 */
export async function getDownloadedMedia(
  id: string
): Promise<DownloadedMedia | null> {
  const db = await openDB();
  const transaction = db.transaction([METADATA_STORE], "readonly");
  const store = transaction.objectStore(METADATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get downloaded media by type (MOVIE or TV_SHOW)
 */
export async function getDownloadedMediaByType(
  type: "MOVIE" | "TV_SHOW"
): Promise<DownloadedMedia[]> {
  const db = await openDB();
  const transaction = db.transaction([METADATA_STORE], "readonly");
  const store = transaction.objectStore(METADATA_STORE);
  const index = store.index("type");

  return new Promise((resolve, reject) => {
    const request = index.getAll(type);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete downloaded media
 */
export async function deleteDownloadedMedia(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([METADATA_STORE], "readwrite");
  const store = transaction.objectStore(METADATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if media is downloaded
 */
export async function isMediaDownloaded(id: string): Promise<boolean> {
  const media = await getDownloadedMedia(id);
  return media !== null;
}

/**
 * Get total storage used by downloaded media
 */
export async function getTotalStorageUsed(): Promise<number> {
  const allMedia = await getAllDownloadedMedia();
  return allMedia.reduce((total, media) => total + (media.fileSize || 0), 0);
}

/**
 * Clear all downloaded media
 */
export async function clearAllDownloadedMedia(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(
    [METADATA_STORE, MEDIA_STORE],
    "readwrite"
  );

  const metadataStore = transaction.objectStore(METADATA_STORE);
  const mediaStore = transaction.objectStore(MEDIA_STORE);

  return new Promise((resolve, reject) => {
    const clearMetadata = metadataStore.clear();
    const clearMedia = mediaStore.clear();

    let completed = 0;
    const checkComplete = () => {
      completed++;
      if (completed === 2) resolve();
    };

    clearMetadata.onsuccess = checkComplete;
    clearMedia.onsuccess = checkComplete;
    clearMetadata.onerror = () => reject(clearMetadata.error);
    clearMedia.onerror = () => reject(clearMedia.error);
  });
}
