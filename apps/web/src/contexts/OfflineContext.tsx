import { createContext, type ReactNode, useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { DownloadedMedia } from "@/lib/offline-storage";
import {
  getAllDownloadedMedia,
  getDownloadedMediaByType,
  getTotalStorageUsed,
} from "@/lib/offline-storage";

export interface OfflineContextType {
  isOnline: boolean;
  wasOffline: boolean;
  downloadedMedia: DownloadedMedia[];
  downloadedMovies: DownloadedMedia[];
  downloadedTVShows: DownloadedMedia[];
  storageUsed: number;
  refreshDownloads: () => Promise<void>;
  isLoading: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [downloadedMedia, setDownloadedMedia] = useState<DownloadedMedia[]>([]);
  const [downloadedMovies, setDownloadedMovies] = useState<DownloadedMedia[]>(
    []
  );
  const [downloadedTVShows, setDownloadedTVShows] = useState<DownloadedMedia[]>(
    []
  );
  const [storageUsed, setStorageUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDownloads = async () => {
    try {
      setIsLoading(true);
      const [allMedia, movies, tvShows, storage] = await Promise.all([
        getAllDownloadedMedia(),
        getDownloadedMediaByType("MOVIE"),
        getDownloadedMediaByType("TV_SHOW"),
        getTotalStorageUsed(),
      ]);

      setDownloadedMedia(allMedia);
      setDownloadedMovies(movies);
      setDownloadedTVShows(tvShows);
      setStorageUsed(storage);
    } catch (error) {
      console.error("Error loading offline media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load downloaded media on mount
  useEffect(() => {
    refreshDownloads();
  }, []);

  // Refresh when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      // Optional: sync with server when coming back online
      refreshDownloads();
    }
  }, [isOnline, wasOffline]);

  const value: OfflineContextType = {
    isOnline,
    wasOffline,
    downloadedMedia,
    downloadedMovies,
    downloadedTVShows,
    storageUsed,
    refreshDownloads,
    isLoading,
  };

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export { OfflineContext };
