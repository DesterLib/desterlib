import { BaseEndpoint } from "./base.endpoint.js";
import type { NotificationEvent } from "../schemas/notification.schemas.js";

/**
 * Callback type for notification events
 */
export type NotificationCallback = (event: NotificationEvent) => void;

/**
 * Notifications endpoint
 * Handles real-time notifications via Server-Sent Events (SSE)
 */
export class NotificationsEndpoint extends BaseEndpoint {
  /**
   * Connect to the notification stream
   * Returns an EventSource that can be used to receive real-time notifications
   *
   * @example
   * ```typescript
   * const eventSource = api.notifications.stream((event) => {
   *   console.log('Notification:', event.message);
   *   if (event.type === 'scan' && event.status === 'completed') {
   *     console.log('Scan finished!');
   *   }
   * });
   *
   * // Later, close the connection
   * eventSource.close();
   * ```
   *
   * @param onNotification - Callback function called for each notification
   * @param onError - Optional callback for connection errors
   * @returns EventSource instance for managing the connection
   */
  stream(
    onNotification: NotificationCallback,
    onError?: (error: Event) => void
  ): EventSource {
    const url = `${this.client.getBaseUrl()}/api/notifications/stream`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as NotificationEvent;
        onNotification(notification);
      } catch (error) {
        console.error("Failed to parse notification:", error);
      }
    };

    if (onError) {
      eventSource.onerror = onError;
    }

    return eventSource;
  }

  /**
   * Connect to notification stream with Promise-based interface
   * Useful for environments that don't support EventSource (like React Native)
   *
   * Note: For Flutter/Dart, use the EventSource directly or a Dart SSE library
   * like 'eventsource' package: https://pub.dev/packages/eventsource
   *
   * @returns Stream URL for manual connection
   */
  getStreamUrl(): string {
    return `${this.client.getBaseUrl()}/api/notifications/stream`;
  }
}
