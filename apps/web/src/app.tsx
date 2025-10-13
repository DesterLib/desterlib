import { useState, useRef, useEffect } from "preact/hooks";
import { AnimatedPresence, Animated } from "./lib/animation";
import ExpandableRow from "./lib/ui/expandable_row";
import DetailsDialog from "./lib/ui/details_dialog";
import { api, type Collection, type Media } from "./lib/api/client";
import Header from "./lib/ui/header";

export function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // Fetch collections on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const collectionsResponse = await api.collections.getAll();

        if (collectionsResponse.success && collectionsResponse.data) {
          setCollections(collectionsResponse.data.collections);
        } else if (!collectionsResponse.success) {
          setError(collectionsResponse.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }

      setLoading(false);
    };

    fetchData();
  }, []);

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
          setError(response.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media");
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

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen lg:px-8 lg:py-12 px-2 py-8 bg-black flex items-center justify-center">
        <Animated show={true} preset="fade" duration={300}>
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white/80 mb-4"></div>
            <p className="text-white/60 text-lg">Loading collections...</p>
          </div>
        </Animated>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen lg:px-8 lg:py-12 px-2 py-8 bg-black flex items-center justify-center">
        <Animated show={true} preset="fadeScale" duration={300}>
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-white text-2xl font-bold mb-2">Oops!</h2>
            <p className="text-white/60 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </Animated>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <Header onMediaSelect={(id) => setCurrentMediaId(id)} />
      <div className="lg:px-8 lg:py-12 px-2 py-8">
        <Animated show={true} preset="fade" duration={500}>
          {collections.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-white/40 text-6xl mb-4">📚</div>
              <h2 className="text-white text-2xl font-semibold mb-2">
                No collections yet
              </h2>
              <p className="text-white/60">
                Start scanning your media to create collections
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 lg:gap-4">
              {collections.map((collection) => {
                const items = collection.recentMedia.map((media) => ({
                  id: media.id,
                  title: media.title,
                  year: media.releaseDate
                    ? new Date(media.releaseDate).getFullYear()
                    : undefined,
                  image:
                    media.backdropUrl ||
                    media.posterUrl ||
                    "https://via.placeholder.com/1280x720/1a1a1a/666666?text=No+Image",
                }));

                return (
                  <ExpandableRow
                    key={collection.id}
                    title={`${collection.name} (${collection.mediaCount})`}
                    items={items}
                    onItemClick={(id) => setCurrentMediaId(id)}
                  />
                );
              })}
            </div>
          )}
        </Animated>
        <AnimatedPresence show={isDialogOpen} exitDuration={300}>
          {(selectedMedia || mediaToRender) && (
            <DetailsDialog
              item={(selectedMedia || mediaToRender)!}
              onClose={() => setCurrentMediaId(null)}
              isOpen={isDialogOpen}
            />
          )}
        </AnimatedPresence>
      </div>
    </main>
  );
}
