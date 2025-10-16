import { useEffect, useState, useCallback } from "react";
import { getActiveServer, getForceOfflineMode } from "@/lib/server-storage";

const API_HEALTH_CHECK_INTERVAL = 30000; // Check every 30 seconds
const API_HEALTH_CHECK_TIMEOUT = 5000; // 5 second timeout

/**
 * Hook to detect online/offline status
 * Monitors ONLY API server availability (ignores browser network status)
 * Can be forced offline via localStorage
 *
 * Offline mode is triggered when:
 * - Force offline mode is enabled, OR
 * - API server is unreachable
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  /**
   * Check if API server is reachable
   */
  const checkApiConnectivity = useCallback(async () => {
    // Check if force offline mode is enabled
    const forceOffline = getForceOfflineMode();
    if (forceOffline) {
      setIsOnline(false);
      return;
    }

    try {
      // Get active server from localStorage
      const activeServer = getActiveServer();
      if (!activeServer) {
        setIsOnline(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_HEALTH_CHECK_TIMEOUT
      );

      const response = await fetch(`${activeServer.url}/api/v1/health`, {
        method: "GET",
        signal: controller.signal,
        // Don't send credentials for health check
        credentials: "omit",
      });

      clearTimeout(timeoutId);

      // Consider API reachable if we get any response (even errors)
      // The fact that we got a response means the server is there
      const apiReachable = response.ok || response.status < 500;

      setIsOnline(apiReachable);
    } catch (error) {
      // Network error, timeout, or server completely unreachable
      console.warn("API connectivity check failed:", error);
      setIsOnline(false);
    }
  }, []);

  // Track when we transition from offline to online
  useEffect(() => {
    if (isOnline && wasOffline) {
      setWasOffline(false);
    } else if (!isOnline && !wasOffline) {
      setWasOffline(true);
    }
  }, [isOnline, wasOffline]);

  // Periodic API health checks
  useEffect(() => {
    // Initial check
    checkApiConnectivity();

    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      checkApiConnectivity();
    }, API_HEALTH_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkApiConnectivity]);

  return {
    isOnline, // API server reachability status
    wasOffline,
  };
}
