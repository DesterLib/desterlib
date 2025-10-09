// @ts-ignore - colorthief types have issues
import ColorThief from "colorthief";

interface ExtractColorsOptions {
  imageUrl: string;
  colorCount?: number;
  format?: "hex" | "rgb";
  onSuccess: (colors: string[]) => void;
  onError?: (error: Error) => void;
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const extractColorsFromImage = async ({
  imageUrl,
  colorCount = 4,
  format = "hex",
  onSuccess,
  onError,
}: ExtractColorsOptions): Promise<void> => {
  try {
    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Create an image element
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const colorThief = new ColorThief();
      try {
        // Extract dominant colors
        const palette = colorThief.getPalette(img, colorCount);

        // Convert RGB arrays to desired format
        const colors =
          format === "hex"
            ? palette.map(([r, g, b]: number[]) => rgbToHex(r, g, b))
            : palette.map(([r, g, b]: number[]) => `rgb(${r}, ${g}, ${b})`);

        onSuccess(colors);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error extracting colors:", err);
        onError?.(err);
      } finally {
        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      }
    };

    img.onerror = () => {
      const error = new Error("Failed to load image for color extraction");
      console.error(error.message);
      URL.revokeObjectURL(blobUrl);
      onError?.(error);
    };

    img.src = blobUrl;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching image:", err);
    onError?.(err);
  }
};

export default extractColorsFromImage;
