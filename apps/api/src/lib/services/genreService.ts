/**
 * Simple Genre Service
 * Handles genre assignment with automatic normalization and deduplication
 */

import prisma from "@/lib/database/prisma";
import { normalizeGenres } from "@/lib/utils/genreMapping";

/**
 * Assign genres to media with automatic deduplication
 */
export async function assignGenresToMedia(
  mediaId: string,
  providerGenres: Array<{ id: number | string; name: string }>
): Promise<{ linked: number; duplicatesAvoided: number }> {
  if (!providerGenres || providerGenres.length === 0) {
    return { linked: 0, duplicatesAvoided: 0 };
  }

  // Normalize and deduplicate genres
  const normalizedGenres = normalizeGenres(providerGenres);
  const duplicatesAvoided = providerGenres.length - normalizedGenres.length;

  let linked = 0;

  for (const { name, slug } of normalizedGenres) {
    // Create or get genre by slug
    const genre = await prisma.genre.upsert({
      where: { slug },
      update: { name }, // Update name if it changed
      create: { name, slug },
    });

    // Link to media if not already linked
    await prisma.mediaGenre.upsert({
      where: {
        mediaId_genreId: {
          mediaId,
          genreId: genre.id,
        },
      },
      update: {},
      create: {
        mediaId,
        genreId: genre.id,
      },
    });

    linked++;
  }

  return { linked, duplicatesAvoided };
}
