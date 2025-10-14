import ExpandableRow from "@/components/ui/expandable_row";
import { useMovies } from "@/lib/hooks/useMovies";
import { useTVShows } from "@/lib/hooks/useTVShows";
import type { Media } from "@dester/api-client";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";

const WatchHome = () => {
  const navigate = useNavigate();

  // Fetch movies
  const {
    data: moviesData,
    isLoading: moviesLoading,
    error: moviesError,
  } = useMovies();

  // Fetch TV shows
  const {
    data: tvShowsData,
    isLoading: tvShowsLoading,
    error: tvShowsError,
  } = useTVShows();

  const handleItemClick = (id: string) => {
    navigate({ to: "/media/$mediaId", params: { mediaId: id } });
  };

  // Show loading state - show if either is still loading
  if (moviesLoading || tvShowsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  // Show error state only if both errored
  if (moviesError && tvShowsError) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-400">
          Error loading content. Please try again later.
        </p>
      </div>
    );
  }

  // Check if both lists are empty
  const hasMovies = moviesData?.media && moviesData.media.length > 0;
  const hasTVShows = tvShowsData?.media && tvShowsData.media.length > 0;

  if (!hasMovies && !hasTVShows && !moviesLoading && !tvShowsLoading) {
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
            items={moviesData.media.map((item: Media) => ({
              id: item.id,
              title: item.title,
              year: item.releaseDate
                ? new Date(item.releaseDate).getFullYear()
                : 0,
              image: item.posterUrl || item.backdropUrl || "",
            }))}
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
            items={tvShowsData.media.map((item: Media) => ({
              id: item.id,
              title: item.title,
              year: item.releaseDate
                ? new Date(item.releaseDate).getFullYear()
                : 0,
              image: item.posterUrl || item.backdropUrl || "",
            }))}
            onItemClick={handleItemClick}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default WatchHome;
