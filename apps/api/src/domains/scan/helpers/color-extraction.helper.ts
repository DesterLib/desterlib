/**
 * Color extraction utilities for mesh gradients
 * Extracts prominent colors from images for UI backgrounds
 */

import { logger } from "@/lib/utils";

// Type definition for node-vibrant v4 Swatch
type VibrantSwatch = {
  hex: string;
  rgb: [number, number, number];
  population: number;
} | null;

// Default fallback colors (vibrant purple-blue theme)
const DEFAULT_MESH_COLORS = [
  "#7C3AED", // Top-left: Vibrant purple
  "#2563EB", // Top-right: Bright blue
  "#EC4899", // Bottom-left: Hot pink
  "#8B5CF6", // Bottom-right: Purple-blue
];

/**
 * Extract mesh gradient colors from an image URL
 * Returns 4 hex color strings for mesh gradient corners
 */
export async function extractMeshColors(imageUrl: string): Promise<string[]> {
  try {
    // Only extract if we have an image URL
    if (!imageUrl) {
      return DEFAULT_MESH_COLORS;
    }

    // Import node-vibrant v4 for Node.js environment
    const { Vibrant } = await import("node-vibrant/node");

    // Extract color palette from image
    const vibrant = new Vibrant(imageUrl);
    const palette: any = await vibrant.getPalette();

    // Extract 4 colors for mesh gradient corners
    // Prefer muted/dark tones for better background aesthetics
    // In v4, swatch has direct 'hex' property
    const color1 = (palette.DarkMuted?.hex ||
        palette.Muted?.hex ||
        palette.Vibrant?.hex ||
        DEFAULT_MESH_COLORS[0]) as string;
    
    const color2 = (palette.Muted?.hex ||
        palette.LightMuted?.hex ||
        palette.LightVibrant?.hex ||
        DEFAULT_MESH_COLORS[1]) as string;
    
    const color3 = (palette.DarkVibrant?.hex ||
        palette.Vibrant?.hex ||
        palette.DarkMuted?.hex ||
        DEFAULT_MESH_COLORS[2]) as string;
    
    const color4 = (palette.LightMuted?.hex ||
        palette.LightVibrant?.hex ||
        palette.Muted?.hex ||
        DEFAULT_MESH_COLORS[3]) as string;

    const colors: string[] = [color1, color2, color3, color4];

    logger.debug(`Extracted mesh colors from ${imageUrl}: ${colors.join(", ")}`);
    return colors;
  } catch (error) {
    logger.warn(
      `Failed to extract colors from ${imageUrl}: ${error instanceof Error ? error.message : error}`
    );
    return DEFAULT_MESH_COLORS;
  }
}

/**
 * Darken a hex color for better background contrast
 */
export function darkenColor(hex: string, amount: number = 0.3): string {
  try {
    // Remove # if present
    const cleanHex = hex.replace("#", "");
    
    // Parse RGB
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    // Darken
    const newR = Math.floor(r * (1 - amount));
    const newG = Math.floor(g * (1 - amount));
    const newB = Math.floor(b * (1 - amount));
    
    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  } catch (error) {
    return hex; // Return original on error
  }
}

/**
 * Extract and darken colors for mesh gradient
 */
export async function extractAndDarkenMeshColors(
  imageUrl: string,
  darkenAmount: number = 0.3
): Promise<string[]> {
  const colors = await extractMeshColors(imageUrl);
  return colors.map((color) => darkenColor(color, darkenAmount));
}

