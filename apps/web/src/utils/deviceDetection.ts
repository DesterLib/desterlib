/**
 * Helper function to detect if running on TV platform
 * Supports multiple methods for Flutter app integration:
 *
 * 1. URL Parameters: ?platform=tv or ?platformType=tv
 * 2. localStorage: Set "platformType" or "devicePlatform"
 * 3. User Agent: Fallback detection for TV devices
 */
export const isTVDevice = (): boolean => {
  // Primary method: Check URL parameters (passed from Flutter app)
  const urlParams = new URLSearchParams(window.location.search);
  const platformType =
    urlParams.get("platform") ||
    urlParams.get("deviceType") ||
    urlParams.get("platformType");

  if (platformType) {
    return platformType.toLowerCase() === "tv";
  }

  // Alternative method: Check localStorage (can be set by Flutter app before navigation)
  try {
    const storedPlatform =
      localStorage.getItem("platformType") ||
      localStorage.getItem("devicePlatform");
    if (storedPlatform) {
      return storedPlatform.toLowerCase() === "tv";
    }
  } catch {
    // Ignore localStorage errors (e.g., in private browsing)
  }

  // Fallback: Check user agent for TV-like devices
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("tv") ||
    userAgent.includes("smart-tv") ||
    userAgent.includes("tizen") ||
    userAgent.includes("webos") ||
    userAgent.includes("roku")
  );
};

/**
 * Helper function to set platform type (can be called from Flutter app if needed)
 * @param platformType - "tv" or "mobile" or "web"
 */
export const setPlatformType = (platformType: string): void => {
  try {
    localStorage.setItem("platformType", platformType.toLowerCase());
  } catch (error) {
    console.warn("Could not set platform type in localStorage:", error);
  }
};
