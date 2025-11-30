/**
 * Media enrichment utilities
 * Extracts colors from media images and saves them to the database
 */

import { logger } from "@dester/logger";
import { Vibrant } from "node-vibrant/node";
import { prisma } from "../prisma";

interface MediaWithColors {
  id: string;
  title?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  meshGradientColors?: string[] | null;
}

/**
 * Enrich media object with mesh gradient colors
 * Extracts colors from poster/backdrop if not already present
 */
export async function enrichMediaWithColors<T extends MediaWithColors>(
  media: T
): Promise<T> {
  // If we already have colors, return immediately
  if (media.meshGradientColors && media.meshGradientColors.length > 0) {
    return media;
  }

  // Prefer poster, fallback to backdrop
  const imageUrl = media.posterUrl || media.backdropUrl;

  if (!imageUrl) {
    return media;
  }

  try {
    // Check if image URL is valid (basic check)
    // We allow http/https and local paths (starting with /)
    if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
      return media;
    }

    // Extract colors
    // Note: node-vibrant might fail with some image formats or network issues
    const palette = await new Vibrant(imageUrl).getPalette();

    // extract 4 colors for mesh gradient
    const colors = [
      palette.Vibrant?.hex,
      palette.LightVibrant?.hex,
      palette.DarkVibrant?.hex,
      palette.Muted?.hex,
    ].filter((c): c is string => !!c);

    // If we found colors, update database and returned object
    if (colors.length > 0) {
      // Pad with existing colors if less than 4 to ensure mesh gradient works
      while (colors.length < 4) {
        colors.push(colors[0]!);
      }

      // Take exactly 4 colors
      const finalColors = colors.slice(0, 4);

      // Update database asynchronously
      await prisma.media.update({
        where: { id: media.id },
        data: { meshGradientColors: finalColors },
      });

      // Update the object in place
      (media as any).meshGradientColors = finalColors;
    }
  } catch (error) {
    // Log warning but don't fail the request
    // Common errors: 404 image, unsupported format, etc.
    logger.warn(
      `Failed to extract colors for media ${media.id} (${media.title}): ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return media;
}

/**
 * Enrich an array of media objects with mesh gradient colors
 * Processes in parallel
 */
export async function enrichMediaArrayWithColors<T extends MediaWithColors>(
  mediaArray: T[]
): Promise<T[]> {
  // Process all media items in parallel
  // Use Promise.all to ensure we wait for all extractions to complete (or fail)
  // before returning. Failed extractions are caught inside enrichMediaWithColors.
  await Promise.all(mediaArray.map((media) => enrichMediaWithColors(media)));

  return mediaArray;
}
