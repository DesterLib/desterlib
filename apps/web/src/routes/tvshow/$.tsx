import { createFileRoute } from "@tanstack/react-router";
import { useTVShowById } from "@/hooks/api/useTVShows";
import { useState } from "react";
import {
  playVideoInFlutter,
  constructStreamingUrl,
  isFlutterWebView,
} from "@/utils/flutterBridge";
import type { Episode } from "@/types/api";
import { Icon } from "@/components/custom/icon";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tvshow/$")({
  component: RouteComponent,
});

function RouteComponent() {
  const { _splat } = Route.useParams();
  const id = _splat || "";
  const { data: tvShow, isLoading, error } = useTVShowById(id);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Invalid TV show ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading TV show...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Error loading TV show: {error.message}</p>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">TV show not found</p>
      </div>
    );
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${remainingMinutes}m`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFileSize = (sizeString: string | null) => {
    if (!sizeString) return null;
    const size = parseFloat(sizeString);
    const gb = size / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const toggleSeason = (seasonNumber: number) => {
    setExpandedSeason(expandedSeason === seasonNumber ? null : seasonNumber);
  };

  // Find the latest episode to play
  const getLatestEpisode = (): Episode | null => {
    if (!tvShow.seasons || tvShow.seasons.length === 0) return null;

    // Get all episodes from all seasons
    const allEpisodes = tvShow.seasons.flatMap(
      (season) => season.episodes || []
    );

    // Sort by season number and episode number, take the last one
    return (
      allEpisodes
        .sort((a, b) => {
          const seasonA =
            tvShow.seasons?.find((s) => s.episodes?.includes(a))?.number || 0;
          const seasonB =
            tvShow.seasons?.find((s) => s.episodes?.includes(b))?.number || 0;
          if (seasonA !== seasonB) return seasonA - seasonB;
          return a.number - b.number;
        })
        .slice(-1)[0] || null
    );
  };

  const handlePlayEpisode = async (episode: Episode, seasonNumber: number) => {
    if (!episode.id) {
      console.error("Episode ID not available");
      return;
    }

    const streamingUrl = constructStreamingUrl(episode.id);
    if (!streamingUrl) {
      console.error("Could not construct streaming URL");
      return;
    }

    try {
      await playVideoInFlutter({
        url: streamingUrl,
        title: tvShow.media.title,
        season: seasonNumber,
        episode: episode.number,
        episodeTitle: episode.title,
      });
    } catch (error) {
      console.error("Failed to play episode:", error);
      // TODO: Show user-friendly error message
    }
  };

  const handlePlayLatestEpisode = async () => {
    const latestEpisode = getLatestEpisode();
    if (!latestEpisode) {
      console.error("No episodes available");
      return;
    }

    // Find which season this episode belongs to
    const episodeSeason = tvShow.seasons?.find((season) =>
      season.episodes?.some((ep) => ep.id === latestEpisode.id)
    );

    if (!episodeSeason) {
      console.error("Could not find season for latest episode");
      return;
    }

    await handlePlayEpisode(latestEpisode, episodeSeason.number);
  };

  // Sort seasons by number
  const sortedSeasons = [...(tvShow.seasons || [])].sort(
    (a, b) => a.number - b.number
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div
          className="h-[70vh] overflow-hidden"
          style={{
            mask: "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
            WebkitMask:
              "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
          }}
        >
          <img
            src={tvShow.media.backdropUrl || ""}
            alt={tvShow.media.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <h1 className="text-6xl md:text-7xl font-bold text-white">
              {tvShow.media.title}
            </h1>
            <div className="flex items-center gap-3">
              <div className="text-sm rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                TV SHOW
              </div>
              {tvShow.media.rating && (
                <div className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Icon name="star" size={16} className="text-yellow-400" />
                  <span>{tvShow.media.rating.toFixed(1)}</span>
                </div>
              )}
              {tvShow.media.releaseDate && (
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {new Date(tvShow.media.releaseDate).getFullYear()}
                </div>
              )}
              {sortedSeasons.length > 0 && (
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {sortedSeasons.length} Season
                  {sortedSeasons.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Actions & Info */}
          <div className="flex flex-col gap-6 lg:w-1/3">
            {/* Play Button */}
            <Button
              variant="default"
              onClick={handlePlayLatestEpisode}
              disabled={
                !getLatestEpisode() ||
                (!isFlutterWebView() && !getLatestEpisode()?.filePath)
              }
            >
              <Icon name="play_arrow" size={28} />
              Play Latest Episode
            </Button>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" size="default">
                <Icon name="favorite" size={20} />
                Add to List
              </Button>
              <Button variant="secondary" size="default">
                <Icon name="library_add" size={20} />
                Library
              </Button>
            </div>

            {/* TV Show Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Show Details</h3>
              <div className="space-y-3">
                {tvShow.media.releaseDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Release Date</span>
                    <span>{formatDate(tvShow.media.releaseDate)}</span>
                  </div>
                )}
                {tvShow.creator && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creator</span>
                    <span>{tvShow.creator}</span>
                  </div>
                )}
                {tvShow.network && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network</span>
                    <span>{tvShow.network}</span>
                  </div>
                )}
                {tvShow.media.rating && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating</span>
                    <div className="flex items-center gap-1">
                      <Icon
                        name="star"
                        size={16}
                        filled
                        className="text-yellow-400"
                      />
                      <span>{tvShow.media.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {sortedSeasons.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seasons</span>
                    <span>{sortedSeasons.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:w-2/3 space-y-8">
            {/* Description */}
            {tvShow.media.description && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Overview</h3>
                <p className="text-gray-300 leading-relaxed text-base">
                  {tvShow.media.description}
                </p>
              </div>
            )}

            {/* Seasons and Episodes */}
            {sortedSeasons.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-6">
                  Seasons & Episodes
                </h3>
                <div className="space-y-4">
                  {sortedSeasons.map((season) => {
                    const isExpanded = expandedSeason === season.number;
                    const sortedEpisodes = [...(season.episodes || [])].sort(
                      (a, b) => a.number - b.number
                    );

                    return (
                      <div
                        key={season.id}
                        className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                      >
                        {/* Season Header */}
                        <button
                          onClick={() => toggleSeason(season.number)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <h4 className="text-lg font-semibold">
                              Season {season.number}
                            </h4>
                            <span className="text-sm text-gray-400">
                              {sortedEpisodes.length} episode
                              {sortedEpisodes.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <Icon
                            name={isExpanded ? "expand_less" : "expand_more"}
                            size={24}
                            className="text-gray-400"
                          />
                        </button>

                        {/* Episodes List */}
                        {isExpanded && (
                          <div className="border-t border-white/10">
                            {sortedEpisodes.length > 0 ? (
                              <div className="p-6 space-y-3">
                                {sortedEpisodes.map((episode) => (
                                  <div
                                    key={episode.id}
                                    className="flex items-center gap-4 p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex-shrink-0 h-20 aspect-video rounded-lg overflow-hidden bg-white/10">
                                      {episode.stillPath ? (
                                        <img
                                          src={episode.stillPath}
                                          alt={episode.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Icon name="play_arrow" size={20} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-300">
                                          Episode {episode.number}
                                        </span>
                                        {episode.duration && (
                                          <span className="text-xs text-gray-400">
                                            {formatDuration(episode.duration)}
                                          </span>
                                        )}
                                        {episode.airDate && (
                                          <span className="text-xs text-gray-400">
                                            {formatDate(episode.airDate)}
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="font-medium text-white truncate">
                                        {episode.title}
                                      </h5>
                                      {episode.fileSize && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          {formatFileSize(episode.fileSize)}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      onClick={() =>
                                        handlePlayEpisode(
                                          episode,
                                          season.number
                                        )
                                      }
                                      disabled={
                                        !episode.filePath ||
                                        (!isFlutterWebView() &&
                                          !episode.filePath)
                                      }
                                    >
                                      <Icon name="play_arrow" size={16} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center text-gray-400">
                                <p>No episodes available</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
