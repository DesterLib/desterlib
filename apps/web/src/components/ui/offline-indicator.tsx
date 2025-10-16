import { motion, AnimatePresence } from "motion/react";
import { ServerOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useState } from "react";

/**
 * OfflineIndicator - Shows a banner when the app is offline
 * and a brief notification when coming back online
 */
export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showOnlineNotification, setShowOnlineNotification] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      // Show "back online" notification briefly
      setShowOnlineNotification(true);
      const timer = setTimeout(() => {
        setShowOnlineNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[100] bg-orange-500/90 backdrop-blur-md text-white py-2 px-4 shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <ServerOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                Server unreachable. Showing downloaded content.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Online Notification */}
      <AnimatePresence>
        {showOnlineNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[100] bg-green-500/90 backdrop-blur-md text-white py-2 px-4 shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">You're back online!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
