import { useState, useRef, useEffect } from "preact/hooks";
import { AnimatedPresence } from "./lib/animation";
import DetailsDialog from "./lib/ui/details_dialog";
import { api, type Media } from "./lib/api/client";
import Header from "./lib/ui/header";
import Home from "./lib/ui/pages/home";
import Library from "./lib/ui/pages/library";
import Settings from "./lib/ui/pages/settings";
import { useNotifications } from "./lib/hooks/useNotifications";
import NotificationCenter from "./lib/ui/notifications/notification_center";

export function App() {
  const [currentPage, setCurrentPage] = useState<
    "home" | "library" | "settings"
  >("home");
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // Notifications
  const {
    notifications,
    addNotification,
    clearNotification,
    clearAll,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Handle page navigation
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/library") {
      setCurrentPage("library");
    } else if (path === "/settings") {
      setCurrentPage("settings");
    } else {
      setCurrentPage("home");
    }

    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/library") {
        setCurrentPage("library");
      } else if (path === "/settings") {
        setCurrentPage("settings");
      } else {
        setCurrentPage("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle navigation
  const handleNavigate = (page: "home" | "library" | "settings") => {
    const path = page === "home" ? "/" : `/${page}`;
    window.history.pushState({}, "", path);
    setCurrentPage(page);
  };

  // Fetch full media details when a media is selected
  useEffect(() => {
    if (!currentMediaId) {
      setSelectedMedia(null);
      return;
    }

    const fetchMediaDetails = async () => {
      try {
        const response = await api.media.getById(currentMediaId);

        if (response.success && response.data) {
          setSelectedMedia(response.data.media);
        } else if (!response.success) {
          console.error("Failed to load media:", response.error.message);
        }
      } catch (err) {
        console.error("Failed to load media:", err);
      }
    };

    fetchMediaDetails();
  }, [currentMediaId]);

  const isDialogOpen = currentMediaId !== null;

  // Keep a reference to the last selected media for exit animation
  const lastSelectedMediaRef = useRef<typeof selectedMedia | null>(null);

  // Update the ref when media is selected
  useEffect(() => {
    if (selectedMedia) {
      lastSelectedMediaRef.current = selectedMedia;
    }
  }, [selectedMedia]);

  // Use lastSelectedMedia for rendering during exit animation
  const mediaToRender = selectedMedia || lastSelectedMediaRef.current;

  return (
    <main className="min-h-screen bg-black pb-24 md:pb-0">
      <Header
        onMediaSelect={(id) => setCurrentMediaId(id)}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        showSearch={currentPage === "home"}
        notificationCenter={
          currentPage === "settings" ? (
            <NotificationCenter
              notifications={notifications}
              onClear={clearNotification}
              onClearAll={clearAll}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
          ) : undefined
        }
      />

      {currentPage === "home" && (
        <Home onMediaSelect={(id) => setCurrentMediaId(id)} />
      )}

      {currentPage === "library" && (
        <Library onMediaSelect={(id) => setCurrentMediaId(id)} />
      )}

      {currentPage === "settings" && (
        <Settings addNotification={addNotification} />
      )}

      <AnimatedPresence show={isDialogOpen} exitDuration={300}>
        {(selectedMedia || mediaToRender) && (
          <DetailsDialog
            item={(selectedMedia || mediaToRender)!}
            onClose={() => setCurrentMediaId(null)}
            isOpen={isDialogOpen}
          />
        )}
      </AnimatedPresence>
    </main>
  );
}
