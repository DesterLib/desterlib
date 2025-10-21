/**
 * Utilities for Flutter WebView bridge communication
 */

// Extend window interface to include Flutter bridge functions
declare global {
  interface Window {
    isFlutterWebView?: boolean;
    flutterPlayVideo?: (videoData: FlutterVideoData) => Promise<void>;
    flutterOpenSettings?: () => Promise<void>;
  }
}

export interface FlutterVideoData {
  url: string;
  title?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
}

/**
 * Check if the app is running inside a Flutter WebView
 */
export const isFlutterWebView = (): boolean => {
  return (
    typeof window.isFlutterWebView === "boolean" && window.isFlutterWebView
  );
};

/**
 * Play video using Flutter bridge if available, otherwise fallback to error
 */
export const playVideoInFlutter = async (
  videoData: FlutterVideoData
): Promise<void> => {
  // Check if we're in Flutter WebView and the bridge is available
  if (!isFlutterWebView() || !window.flutterPlayVideo) {
    console.warn("Flutter bridge not available - cannot play video");
    throw new Error("Flutter bridge not available");
  }

  console.log("🎬 Calling Flutter video player with data:", videoData);

  try {
    await window.flutterPlayVideo(videoData);
    console.log("✅ Video playback initiated in Flutter");
  } catch (error) {
    console.error("❌ Failed to play video in Flutter:", error);
    throw error;
  }
};

/**
 * Open native Flutter settings page if available, otherwise fallback to error
 */
export const openSettingsInFlutter = async (): Promise<void> => {
  // Check if we're in Flutter WebView and the bridge is available
  if (!isFlutterWebView() || !window.flutterOpenSettings) {
    console.warn("Flutter bridge not available - cannot open settings");
    throw new Error("Flutter bridge not available");
  }

  console.log("⚙️ Calling Flutter settings page");

  try {
    await window.flutterOpenSettings();
    console.log("✅ Settings page opened in Flutter");
  } catch (error) {
    console.error("❌ Failed to open settings in Flutter:", error);
    throw error;
  }
};

/**
 * Construct streaming URL from media ID
 * Uses the centralized streaming API to serve media with proper byte-range support
 */
export const constructStreamingUrl = (
  mediaId: string | null
): string | null => {
  if (!mediaId) {
    return null;
  }

  // In development, use relative URL to leverage Vite proxy
  // In production, use the full API URL
  const API_BASE_URL = import.meta.env.DEV
    ? "" // Use relative URLs in dev
    : import.meta.env.VITE_API_URL || "http://localhost:3001";

  // Use the centralized streaming API endpoint
  // This provides proper byte-range request support for video streaming
  return `${API_BASE_URL}/api/v1/stream/${mediaId}`;
};

/**
 * Construct streaming URL from file path (legacy support)
 * @deprecated Use constructStreamingUrl with media ID instead
 */
export const constructStreamingUrlFromPath = (
  filePath: string | null
): string | null => {
  if (!filePath) {
    return null;
  }

  // If the file path is already a full URL, return it
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // For Flutter WebView, we can try different approaches:
  // 1. Use the file path directly (Flutter might handle local file paths)
  // 2. Convert to file:// URL
  // 3. Use a streaming endpoint if available

  // First, try using the file path directly - Flutter might handle this
  // This is often the preferred approach for local media files
  return filePath;
};
