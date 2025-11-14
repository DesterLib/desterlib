/**
 * Middleware helper for on-demand color extraction
 * Extracts and caches mesh gradient colors when media is requested
 */

import prisma from "@/lib/database/prisma";
import { logger } from "@/lib/utils";
import { extractAndDarkenMeshColors } from "./color-extraction.helper";

/**
 * Ensure media has mesh gradient colors extracted
 * If colors don't exist, extract them from backdrop and cache in database
 */
export async function ensureMeshColors(
  mediaId: string,
  backdropUrl: string | null,
  mediaTitle?: string
): Promise<string[]> {
  try {
    // Check if media already has colors
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { meshGradientColors: true, title: true },
    });

    const title = mediaTitle || media?.title || mediaId;

    // If colors already exist, return them
    if (
      media?.meshGradientColors &&
      Array.isArray(media.meshGradientColors) &&
      media.meshGradientColors.length === 4
    ) {
      logger.debug(`[${title}] Using cached mesh colors: ${media.meshGradientColors.join(", ")}`);
      return media.meshGradientColors;
    }

    // No colors yet - extract them
    if (!backdropUrl) {
      logger.debug(`[${title}] No backdrop URL, skipping color extraction`);
      return [];
    }

    logger.info(`[${title}] 🎨 Extracting mesh colors from backdrop...`);
    const colors = await extractAndDarkenMeshColors(backdropUrl, 0.4);

    // Cache colors in database
    await prisma.media.update({
      where: { id: mediaId },
      data: { meshGradientColors: colors },
    });

    logger.info(`[${title}] ✓ Colors extracted and cached: ${colors.join(", ")}`);
    return colors;
  } catch (error) {
    const title = mediaTitle || mediaId;
    logger.warn(
      `[${title}] Failed to extract/cache colors: ${error instanceof Error ? error.message : error}`
    );
    return [];
  }
}

/**
 * Enrich media object with mesh gradient colors
 * Returns immediately - extracts colors in background if needed
 */
export async function enrichMediaWithColors<T extends { id: string; title?: string; backdropUrl: string | null; meshGradientColors?: string[] | null }>(
  media: T
): Promise<T> {
  const title = media.title || media.id;
  
  // If colors already exist, return them
  if (
    media.meshGradientColors &&
    Array.isArray(media.meshGradientColors) &&
    media.meshGradientColors.length === 4
  ) {
    logger.debug(`[${title}] ✓ Using cached mesh colors`);
    return media;
  }

  // No colors yet - trigger background extraction but don't wait for it
  if (media.backdropUrl) {
    logger.info(`[${title}] 🎨 Triggering background color extraction...`);
    
    // Extract in background - don't await!
    ensureMeshColors(media.id, media.backdropUrl, media.title)
      .then((colors) => {
        logger.info(`[${title}] ✓ Background extraction complete: ${colors.join(", ")}`);
      })
      .catch((err) => {
        logger.warn(`[${title}] Background extraction failed: ${err.message}`);
      });
  }
  
  // Return immediately without colors (will be available on next request)
  return media;
}

/**
 * Enrich an array of media objects with mesh gradient colors
 * Returns immediately - triggers background extraction for items without colors
 */
export async function enrichMediaArrayWithColors<T extends { id: string; title?: string; backdropUrl: string | null; meshGradientColors?: string[] | null }>(
  mediaArray: T[]
): Promise<T[]> {
  const withColors = mediaArray.filter((m) => m.meshGradientColors?.length === 4).length;
  const withoutColors = mediaArray.length - withColors;
  
  logger.info(`📊 Media colors: ${withColors} cached, ${withoutColors} to extract in background`);
  
  // Process all media (returns immediately, extracts in background)
  const enrichedMedia = await Promise.all(
    mediaArray.map((media) => enrichMediaWithColors(media))
  );
  
  return enrichedMedia;
}

