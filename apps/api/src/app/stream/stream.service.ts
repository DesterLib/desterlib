import { findMediaFileById } from "../../infrastructure/utils/media-finder";
import type { MediaFileInfo } from "../../infrastructure/utils/media-finder";

export type { MediaFileInfo };

export const streamService = {
  getMediaFileById: findMediaFileById,
};
