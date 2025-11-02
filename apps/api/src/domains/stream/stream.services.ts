import { findMediaFileById } from "@/lib/utils";
import type { MediaFileInfo } from "@/lib/utils/media-finder.util";

/**
 * Re-export MediaFileInfo for external use
 */
export type { MediaFileInfo };

/**
 * Service to find media file by ID across all media types
 */
export const streamServices = {
  /**
   * Find media file info by ID across movies, episodes, music, and comics
   * Delegates to the unified media finder utility
   */
  getMediaFileById: findMediaFileById,
};
