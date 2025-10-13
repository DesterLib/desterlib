import { useState, useRef, useEffect } from "preact/hooks";
import { AnimatedPresence } from "./lib/animation";
import DetailsDialog from "./lib/ui/details_dialog";
import { api, type Media } from "./lib/api/client";
import Header from "./lib/ui/header";
import Home from "./lib/ui/pages/home";
import Library from "./lib/ui/pages/library";

export function App() {
  const [currentPage, setCurrentPage] = useState<
    "home" | "library" | "settings"
  >("home");
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

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
      />

      {currentPage === "home" && (
        <Home onMediaSelect={(id) => setCurrentMediaId(id)} />
      )}

      {currentPage === "library" && (
        <Library onMediaSelect={(id) => setCurrentMediaId(id)} />
      )}

      {currentPage === "settings" && (
        <div className="lg:px-8 lg:py-12 px-2 py-8">
          <div className="text-center py-16 px-4">
            <div className="text-white/40 text-6xl mb-4">⚙️</div>
            <h2 className="text-white text-2xl font-semibold mb-2">Settings</h2>
            <p className="text-white/60">Settings page coming soon</p>
          </div>
        </div>
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
