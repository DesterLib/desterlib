/**
 * React Hook for WebSocket Integration
 *
 * Provides WebSocket functionality with React Query integration
 * for automatic cache invalidation on real-time updates
 */

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webSocketClient, WS_EVENTS } from "@/lib/websocket";

/**
 * Hook to setup WebSocket connection and event listeners
 * Automatically invalidates React Query cache when events are received
 */
export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to WebSocket
    webSocketClient.connect();

    // Setup event listeners for settings updates
    const handleSettingsUpdated = () => {
      console.log("Settings updated via WebSocket - invalidating cache");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["setup-status"] });
    };

    const handleSetupCompleted = () => {
      console.log("Setup completed via WebSocket - invalidating cache");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["setup-status"] });
    };

    // Setup event listener for health status changes
    const handleHealthStatusChanged = () => {
      console.log("Health status changed via WebSocket - invalidating cache");
      queryClient.invalidateQueries({ queryKey: ["admin", "health"] });
      queryClient.invalidateQueries({ queryKey: ["health"] });
    };

    // Setup event listeners for scan events
    const handleScanStarted = () => {
      console.log("Scan started via WebSocket");
      // Could show a notification or update UI
    };

    const handleScanCompleted = () => {
      console.log("Scan completed via WebSocket - invalidating media cache");
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["tv-shows"] });
      queryClient.invalidateQueries({ queryKey: ["music"] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    };

    // Subscribe to events
    webSocketClient.on(WS_EVENTS.SETTINGS_UPDATED, handleSettingsUpdated);
    webSocketClient.on(
      WS_EVENTS.SETTINGS_SETUP_COMPLETED,
      handleSetupCompleted
    );
    webSocketClient.on(
      WS_EVENTS.HEALTH_STATUS_CHANGED,
      handleHealthStatusChanged
    );
    webSocketClient.on(WS_EVENTS.SCAN_STARTED, handleScanStarted);
    webSocketClient.on(WS_EVENTS.SCAN_COMPLETED, handleScanCompleted);

    // Cleanup on unmount
    return () => {
      webSocketClient.off(WS_EVENTS.SETTINGS_UPDATED, handleSettingsUpdated);
      webSocketClient.off(
        WS_EVENTS.SETTINGS_SETUP_COMPLETED,
        handleSetupCompleted
      );
      webSocketClient.off(
        WS_EVENTS.HEALTH_STATUS_CHANGED,
        handleHealthStatusChanged
      );
      webSocketClient.off(WS_EVENTS.SCAN_STARTED, handleScanStarted);
      webSocketClient.off(WS_EVENTS.SCAN_COMPLETED, handleScanCompleted);
      // Don't disconnect here as other components might be using it
    };
  }, [queryClient]);

  return {
    isConnected: webSocketClient.isConnected(),
    subscribe: useCallback(
      (room: string) => webSocketClient.subscribe(room),
      []
    ),
    unsubscribe: useCallback(
      (room: string) => webSocketClient.unsubscribe(room),
      []
    ),
    emit: useCallback(
      (event: string, data?: unknown) => webSocketClient.emit(event, data),
      []
    ),
  };
}

/**
 * Hook to listen to specific WebSocket events
 */
export function useWebSocketEvent(
  event: string,
  callback: (data: unknown) => void
) {
  useEffect(() => {
    webSocketClient.on(event, callback);

    return () => {
      webSocketClient.off(event, callback);
    };
  }, [event, callback]);
}
