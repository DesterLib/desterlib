import {
  XIcon,
  PlayIcon,
  PlusIcon,
  Film,
  ChevronDownIcon,
  TvIcon,
} from "lucide-preact";
import { useRef, useState } from "preact/hooks";
import Button from "./button";
import { useBodyScrollLock } from "../hooks/use_body_scroll_lock";
import { useMeasuredHeight } from "../hooks/use_measured_height";
import { AnimatedHeight } from "../animation";
import { ModalOverlay, ModalCard } from "./modal";
import type { Media } from "../api/client";

// Helper function to send video playback signal to Swift app
const playVideo = (streamUrl: string) => {
  console.log("🎬 [playVideo] Attempting to play video with URL:", streamUrl);

  try {
    if (
      typeof window !== "undefined" &&
      window.webkit?.messageHandlers?.playVideo
    ) {
      console.log(
        "✅ [playVideo] Swift message handler available, sending message..."
      );
      window.webkit.messageHandlers.playVideo.postMessage({ url: streamUrl });
      console.log("✅ [playVideo] Message sent successfully " + streamUrl);
    } else {
      console.warn(
        "❌ [playVideo] Swift message handler not available " + streamUrl
      );
      alert(
        "Video playback is not available. Please open this app in the native Swift application."
      );
    }
  } catch (error) {
    console.error(
      "❌ [playVideo] Error sending video signal to Swift app:",
      error
    );
    alert(
      "Failed to start video playback. Error: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
};

const DetailsDialog = ({
  item,
  onClose,
  isOpen = true,
}: {
  item: Media;
  onClose: () => void;
  isOpen: boolean;
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(
    new Set()
  );
  const contentHeight = useMeasuredHeight(contentRef, [expandedSeasons, item]);

  // Lock body scroll when dialog is open
  useBodyScrollLock(isOpen);

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });
  };

  const handlePlayClick = () => {
    console.log(
      "🎯 [handlePlayClick] Play button clicked for:",
      item.type,
      item.title
    );
    console.log("🎯 [handlePlayClick] Item data:", item);

    if (item.type === "MOVIE" && item.movie?.streamUrl) {
      console.log(
        "🎥 [handlePlayClick] Playing movie with streamUrl:",
        item.movie.streamUrl
      );
      playVideo(item.movie.streamUrl);
    } else if (item.type === "TV_SHOW" && item.tvShow?.seasons.length) {
      // Find season 1
      const season1 = item.tvShow.seasons.find((s) => s.number === 1);
      console.log("📺 [handlePlayClick] Found season 1:", season1);

      if (season1 && season1.episodes.length > 0) {
        // Play first episode of season 1
        const episode1 = season1.episodes.find((e) => e.number === 1);
        const firstEpisode = episode1 || season1.episodes[0];
        console.log(
          "📺 [handlePlayClick] Playing first episode:",
          firstEpisode
        );

        if (firstEpisode?.streamUrl) {
          playVideo(firstEpisode.streamUrl);
        } else {
          console.warn("⚠️ [handlePlayClick] First episode has no streamUrl");
        }
      } else {
        console.warn("⚠️ [handlePlayClick] No episodes found in season 1");
      }
    } else {
      console.warn("⚠️ [handlePlayClick] No valid media or streamUrl found");
    }
  };

  // Get display values
  const year = item.releaseDate
    ? new Date(item.releaseDate).getFullYear()
    : undefined;
  const displayImage =
    item.backdropUrl ||
    item.posterUrl ||
    "https://via.placeholder.com/1280x720/1a1a1a/666666?text=No+Image";

  return (
    <ModalOverlay
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-start lg:items-center justify-center z-50 overflow-hidden p-0 lg:p-4"
      onClose={onClose}
      isOpen={isOpen}
    >
      <ModalCard
        className="relative lg:rounded-2xl min-h-full lg:min-h-0 lg:max-h-[calc(100vh-2rem)] lg:max-w-[900px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-y-auto lg:my-4 bg-[#1d1d1f]"
        isOpen={isOpen}
      >
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="subtle"
          size="icon"
          className="absolute top-4 right-4 z-10 rounded-full"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5" />
        </Button>

        {/* Hero Image */}
        <div className="relative">
          <img
            src={displayImage}
            alt={item.title}
            className="w-full aspect-video object-cover block"
            style={{
              maskImage:
                "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,1) 60%)",
              WebkitMaskImage:
                "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,1) 60%)",
            }}
          />
        </div>

        <div className="px-8 pb-8 -mt-16 relative z-10">
          {/* Title & Year */}
          <div className="mb-6">
            <h2 className="text-[2.5rem] font-bold m-0 mb-2 text-[#f5f5f7] tracking-tight leading-tight">
              {item.title}
            </h2>
            <div className="flex items-center gap-3 text-[#86868b] text-sm">
              {year && (
                <>
                  <span>{year}</span>
                  <span>•</span>
                </>
              )}
              <span className="uppercase">{item.type.replace("_", " ")}</span>
              {item.rating && (
                <>
                  <span>•</span>
                  <span className="text-yellow-500">
                    ★ {item.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col lg:flex-row gap-3 mb-6">
            <Button
              variant="primary"
              size="md"
              className="gap-2"
              onClick={handlePlayClick}
            >
              <PlayIcon className="w-5 h-5" fill="white" />
              Play
            </Button>
            <Button variant="outline" size="md" className="gap-2">
              <PlusIcon className="w-5 h-5" />
              Watchlist
            </Button>
          </div>

          {/* Description */}
          <AnimatedHeight height={contentHeight}>
            <div ref={contentRef}>
              <div className="mb-6">
                <h3 className="text-[#f5f5f7] text-lg font-semibold mb-3 flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#0071e3]" />
                  Overview
                </h3>
                <p className="text-[#d2d2d7] text-base leading-relaxed m-0">
                  {item.description || "No description available."}
                </p>
              </div>

              {/* TV Show Seasons & Episodes */}
              {item.type === "TV_SHOW" &&
                item.tvShow &&
                item.tvShow.seasons.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[#f5f5f7] text-lg font-semibold mb-3 flex items-center gap-2">
                      <TvIcon className="w-5 h-5 text-[#0071e3]" />
                      Seasons & Episodes
                    </h3>
                    <div className="space-y-2">
                      {item.tvShow.seasons.map((season) => {
                        const isExpanded = expandedSeasons.has(season.id);
                        return (
                          <div
                            key={season.id}
                            className="bg-white/5 rounded-lg overflow-hidden ring-1 ring-white/10"
                          >
                            <button
                              onClick={() => toggleSeason(season.id)}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[#f5f5f7] font-medium">
                                  Season {season.number}
                                </span>
                                <span className="text-[#86868b] text-sm">
                                  {season.episodes.length}{" "}
                                  {season.episodes.length === 1
                                    ? "episode"
                                    : "episodes"}
                                </span>
                              </div>
                              <ChevronDownIcon
                                className={`w-5 h-5 text-[#86868b] transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-3 space-y-2">
                                {season.episodes.map((episode) => (
                                  <button
                                    key={episode.id}
                                    onClick={() => {
                                      console.log(
                                        "📺 [Episode Click] Episode clicked:",
                                        episode.number,
                                        episode.title
                                      );
                                      console.log(
                                        "📺 [Episode Click] Episode streamUrl:",
                                        episode.streamUrl
                                      );
                                      if (episode.streamUrl) {
                                        playVideo(episode.streamUrl);
                                      } else {
                                        console.warn(
                                          "⚠️ [Episode Click] Episode has no streamUrl"
                                        );
                                      }
                                    }}
                                    disabled={!episode.streamUrl}
                                    className="w-full flex items-start gap-3 py-2 px-3 rounded hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-left"
                                  >
                                    <span className="text-[#86868b] text-sm font-medium min-w-[2rem]">
                                      {episode.number}
                                    </span>
                                    <div className="flex-1">
                                      <p className="text-[#d2d2d7] text-sm m-0">
                                        {episode.title}
                                      </p>
                                      {episode.duration && (
                                        <p className="text-[#86868b] text-xs m-0 mt-1">
                                          {episode.duration} min
                                        </p>
                                      )}
                                    </div>
                                    {episode.streamUrl && (
                                      <PlayIcon className="w-4 h-4 text-[#86868b] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </AnimatedHeight>
        </div>
      </ModalCard>
    </ModalOverlay>
  );
};

export default DetailsDialog;
