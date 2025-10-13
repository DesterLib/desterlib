import { useState, useEffect, useMemo } from "preact/hooks";
import { Animated } from "../../animation";
import ExpandableRow from "../expandable_row";
import LibraryFilters from "../filters/library_filters";
import { api, type Collection } from "../../api/client";

interface LibraryProps {
  onMediaSelect: (id: string) => void;
}

export default function Library({ onMediaSelect }: LibraryProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "createdAt" | "mediaCount" | "updatedAt"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<
    "all" | "MOVIE" | "TV_SHOW"
  >("all");

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

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = [...collections];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (collection) =>
          collection.name.toLowerCase().includes(query) ||
          collection.description?.toLowerCase().includes(query)
      );
    }

    // Media type filter
    if (mediaTypeFilter !== "all") {
      filtered = filtered.filter((collection) =>
        collection.recentMedia.some((media) => media.type === mediaTypeFilter)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case "name":
          compareValue = a.name.localeCompare(b.name);
          break;
        case "createdAt":
          compareValue =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          compareValue =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "mediaCount":
          compareValue = a.mediaCount - b.mediaCount;
          break;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [collections, searchQuery, sortBy, sortOrder, mediaTypeFilter]);

  // Loading state
  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-8 lg:py-12 flex items-center justify-center min-h-[50vh]">
        <Animated show={true} preset="fade" duration={300}>
          <div className="text-center">
            <div className="inline-block h-10 w-10 lg:h-8 lg:w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white/80 mb-4"></div>
            <p className="text-white/60 text-base lg:text-lg">
              Loading collections...
            </p>
          </div>
        </Animated>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 lg:px-8 py-8 lg:py-12 flex items-center justify-center min-h-[50vh]">
        <Animated show={true} preset="fadeScale" duration={300}>
          <div className="text-center max-w-md">
            <div className="text-red-500 text-4xl lg:text-5xl mb-4">⚠️</div>
            <h2 className="text-white text-xl lg:text-2xl font-bold mb-2">
              Oops!
            </h2>
            <p className="text-white/60 text-sm lg:text-base mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition-colors min-h-[44px] text-base font-medium"
            >
              Try Again
            </button>
          </div>
        </Animated>
      </div>
    );
  }

  return (
    <div className="px-4 pt-20 md:pt-0 md:px-8 py-6 md:py-12">
      <Animated show={true} preset="fade" duration={500}>
        {collections.length === 0 ? (
          <div className="text-center py-12 lg:py-16 px-4">
            <div className="text-white/40 text-5xl lg:text-6xl mb-3 lg:mb-4">
              📚
            </div>
            <h2 className="text-white text-xl lg:text-2xl font-semibold mb-2">
              No collections yet
            </h2>
            <p className="text-white/60 text-sm lg:text-base">
              Start scanning your media to create collections
            </p>
          </div>
        ) : (
          <>
            <LibraryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              mediaTypeFilter={mediaTypeFilter}
              onMediaTypeChange={setMediaTypeFilter}
            />

            {filteredCollections.length === 0 ? (
              <div className="text-center py-12 lg:py-16 px-4">
                <div className="text-white/40 text-5xl lg:text-6xl mb-3 lg:mb-4">
                  🔍
                </div>
                <h2 className="text-white text-xl lg:text-2xl font-semibold mb-2">
                  No collections found
                </h2>
                <p className="text-white/60 text-sm lg:text-base">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 lg:gap-4">
                {filteredCollections.map((collection) => {
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
                      onItemClick={onMediaSelect}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </Animated>
    </div>
  );
}
