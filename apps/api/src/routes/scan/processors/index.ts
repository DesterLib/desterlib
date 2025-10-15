import { MediaType } from "../../../generated/prisma/index.js";
import type { MediaProcessor } from "./types.js";
import { MovieProcessor } from "./movie.processor.js";
import { TVShowProcessor } from "./tv-show.processor.js";
import { MusicProcessor } from "./music.processor.js";
import { ComicProcessor } from "./comic.processor.js";

// Processor registry
const processors: Record<MediaType, MediaProcessor> = {
  [MediaType.MOVIE]: new MovieProcessor(),
  [MediaType.TV_SHOW]: new TVShowProcessor(),
  [MediaType.MUSIC]: new MusicProcessor(),
  [MediaType.COMIC]: new ComicProcessor(),
};

/**
 * Get the appropriate processor for a media type
 */
export function getProcessor(mediaType: MediaType): MediaProcessor {
  return processors[mediaType];
}

export * from "./types.js";
export { MovieProcessor } from "./movie.processor.js";
export { TVShowProcessor } from "./tv-show.processor.js";
export { MusicProcessor } from "./music.processor.js";
export { ComicProcessor } from "./comic.processor.js";
