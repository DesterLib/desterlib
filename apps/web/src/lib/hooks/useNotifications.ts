import { useState, useCallback } from "preact/hooks";
import type {
  Notification,
  NotificationType,
} from "../ui/notifications/notification_center";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev]);

      // Auto-remove after 10 seconds for success/info
      if (type === "success" || type === "info") {
        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id)
          );
        }, 10000);
      }
    },
    []
  );

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return {
    notifications,
    addNotification,
    clearNotification,
    clearAll,
    markAsRead,
    markAllAsRead,
  };
}
