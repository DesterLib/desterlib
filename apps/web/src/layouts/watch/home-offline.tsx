import ExpandableRow from "@/components/ui/expandable_row";
import { useOffline } from "@/hooks/useOffline";
import type { DownloadedMedia } from "@/lib/offline-storage";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Download, HardDrive } from "lucide-react";

/**
 * Offline version of WatchHome that displays downloaded/local content
 */
const WatchHomeOffline = () => {
  const navigate = useNavigate();
  const { downloadedMovies, downloadedTVShows, storageUsed, isLoading } =
    useOffline();

  const handleItemClick = (id: string) => {
    navigate({ to: "/media/$mediaId", params: { mediaId: id } });
  };

  // Format storage size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white/60">Loading offline content...</p>
      </div>
    );
  }

  const hasMovies = downloadedMovies.length > 0;
  const hasTVShows = downloadedTVShows.length > 0;

  if (!hasMovies && !hasTVShows) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Download className="w-16 h-16 text-white/40" />
        <p className="text-white/60 text-lg">No downloaded content</p>
        <p className="text-white/40 text-sm max-w-md text-center">
          Download content while online to watch it later when you're offline.
        </p>
      </div>
    );
  }

  const mapDownloadedMediaToItems = (media: DownloadedMedia[]) =>
    media.map((item) => ({
      id: item.id,
      title: item.media.title || "Unknown",
      year: item.media.releaseDate
        ? new Date(item.media.releaseDate).getFullYear()
        : 0,
      image:
        item.localPosterPath ||
        item.media.posterUrl ||
        item.media.backdropUrl ||
        "",
    }));

  return (
    <div className="space-y-6">
      {/* Offline Mode Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-neutral-900/60 backdrop-blur-lg border border-white/10 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Offline Mode</h3>
              <p className="text-white/60 text-sm">
                Showing downloaded content only
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Storage Used</p>
            <p className="text-white font-medium">{formatBytes(storageUsed)}</p>
          </div>
        </div>
      </motion.div>

      {/* Content Sections */}
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
              title={`Downloaded Movies (${downloadedMovies.length})`}
              items={mapDownloadedMediaToItems(downloadedMovies)}
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
              title={`Downloaded TV Shows (${downloadedTVShows.length})`}
              items={mapDownloadedMediaToItems(downloadedTVShows)}
              onItemClick={handleItemClick}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default WatchHomeOffline;
