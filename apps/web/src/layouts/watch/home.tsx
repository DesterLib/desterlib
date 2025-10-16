import ExpandableRow from "@/components/ui/expandable_row";
import { useMovies } from "@/lib/hooks/useMovies";
import { useTVShows } from "@/lib/hooks/useTVShows";
import { useOffline } from "@/hooks/useOffline";
import type { Media } from "@dester/api-client";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { WifiOff } from "lucide-react";
import WatchHomeOffline from "./home-offline";

const WatchHome = () => {
  const navigate = useNavigate();
  const { isOnline } = useOffline();

  // Fetch movies
  const {
    data: moviesData,
    isLoading: moviesLoading,
    isError: moviesIsError,
    isFetching: moviesIsFetching,
  } = useMovies();

  // Fetch TV shows
  const {
    data: tvShowsData,
    isLoading: tvShowsLoading,
    isError: tvShowsIsError,
    isFetching: tvShowsIsFetching,
  } = useTVShows();

  const handleItemClick = (id: string) => {
    navigate({ to: "/media/$mediaId", params: { mediaId: id } });
  };

  // Switch to offline UI when not connected
  if (!isOnline) {
    return <WatchHomeOffline />;
  }

  // Show loading state - only if initial load and no cached data
  const hasMoviesData = moviesData?.media && moviesData.media.length > 0;
  const hasTVShowsData = tvShowsData?.media && tvShowsData.media.length > 0;
  const hasCachedData = hasMoviesData || hasTVShowsData;

  if ((moviesLoading || tvShowsLoading) && !hasCachedData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  // Show error state only if both errored AND we're online AND no cached data
  if (moviesIsError && tvShowsIsError && isOnline && !hasCachedData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-400">
          Error loading content. Please try again later.
        </p>
      </div>
    );
  }

  // If offline and no cached data, show offline message
  if (!isOnline && !hasCachedData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <WifiOff className="w-12 h-12 text-white/40" />
        <p className="text-white/60">
          You're offline and no content is cached yet.
        </p>
        <p className="text-white/40 text-sm">
          Connect to the internet to load content.
        </p>
      </div>
    );
  }

  // Check if both lists are empty
  const hasMovies = moviesData?.media && moviesData.media.length > 0;
  const hasTVShows = tvShowsData?.media && tvShowsData.media.length > 0;
  const isStillFetching = moviesIsFetching || tvShowsIsFetching;

  if (
    !hasMovies &&
    !hasTVShows &&
    !moviesLoading &&
    !tvShowsLoading &&
    !isStillFetching
  ) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white/60">No content available yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Movies Section */}
      {hasMovies && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        >
          <ExpandableRow
            title="Movies"
            items={
              moviesData?.media
                ?.filter((item: Media) => item.id && item.title)
                .map((item: Media) => ({
                  id: item.id!,
                  title: item.title!,
                  year: item.releaseDate
                    ? new Date(item.releaseDate).getFullYear()
                    : 0,
                  image: item.posterUrl || item.backdropUrl || "",
                })) || []
            }
            onItemClick={handleItemClick}
          />
        </motion.div>
      )}

      {/* TV Shows Section */}
      {hasTVShows && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <ExpandableRow
            title="TV Shows"
            items={
              tvShowsData?.media
                ?.filter((item: Media) => item.id && item.title)
                .map((item: Media) => ({
                  id: item.id!,
                  title: item.title!,
                  year: item.releaseDate
                    ? new Date(item.releaseDate).getFullYear()
                    : 0,
                  image: item.posterUrl || item.backdropUrl || "",
                })) || []
            }
            onItemClick={handleItemClick}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default WatchHome;
