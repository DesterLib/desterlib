import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getApiV1MediaId } from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  PlayIcon,
  StarIcon,
  UserIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/media/$mediaId")({
  component: MediaDetails,
});

function MediaDetails() {
  const { mediaId } = Route.useParams();
  const navigate = useNavigate();
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["media", mediaId],
    queryFn: async () => {
      const response = await getApiV1MediaId(mediaId);
      if (response.status === 200) {
        return response.data.data?.media ?? null;
      }
      return null;
    },
  });

  // Function to send video playback message to Flutter app
  const playVideo = (
    streamUrl: string,
    options?: {
      seasonNumber?: number;
      episodeNumber?: number;
      episodeTitle?: string;
    }
  ) => {
    const message = {
      url: streamUrl,
      title: data?.title,
      season: options?.seasonNumber,
      episode: options?.episodeNumber,
      episodeTitle: options?.episodeTitle,
    };

    // Check if running in webview (Flutter app)
    if (window.playVideo) {
      window.playVideo.postMessage(JSON.stringify(message));
    } else {
      // Fallback for web browser (could open in new tab or show message)
      console.log("playVideo channel not available. Message:", message);
      alert("Video playback is only available in the mobile app");
    }
  };

  // Function to play a movie
  const playMovie = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const streamUrl = `${baseUrl}/api/v1/media/stream/movie/${mediaId}`;
    playVideo(streamUrl);
  };

  // Function to play an episode
  const playEpisode = (
    seasonNumber: number,
    episodeNumber: number,
    episodeTitle?: string
  ) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const streamUrl = `${baseUrl}/api/v1/media/stream/episode/${mediaId}/${seasonNumber}/${episodeNumber}`;
    playVideo(streamUrl, { seasonNumber, episodeNumber, episodeTitle });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Failed to load media details</p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-white/60 hover:text-white transition-colors"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  const releaseYear = data.releaseDate
    ? new Date(data.releaseDate).getFullYear()
    : null;

  // Get duration based on media type
  const duration =
    data.type === "MOVIE" ? data.movie?.duration : data.tvShow ? null : null;

  // Get cast members
  const cast =
    data.people?.filter((p: { role?: string }) => p.role === "ACTOR") || [];
  const directors =
    data.people?.filter((p: { role?: string }) => p.role === "DIRECTOR") || [];

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[60vh] overflow-hidden">
        {/* Backdrop Image with Gradient Mask */}
        {data.backdropUrl ? (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            src={data.backdropUrl}
            alt={data.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              maskImage:
                "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,1) 60%)",
              WebkitMaskImage:
                "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,1) 60%)",
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-neutral-800" />
        )}

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          onClick={() => navigate({ to: "/" })}
          className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-neutral-900/60 backdrop-blur-lg border border-white/10 rounded-full text-white hover:bg-neutral-900/80 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </motion.button>

        {/* Content positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 items-end">
              {/* Poster */}
              {data.posterUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  className="flex-shrink-0"
                >
                  <img
                    src={data.posterUrl}
                    alt={data.title}
                    className="w-48 h-72 object-cover rounded-2xl shadow-2xl ring-2 ring-white/10"
                  />
                </motion.div>
              )}

              {/* Title and metadata */}
              <div className="flex-1 space-y-4 pb-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                >
                  <h1 className="text-5xl lg:text-6xl font-bold text-white mb-2">
                    {data.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                    {releaseYear && (
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{releaseYear}</span>
                      </div>
                    )}
                    {duration && (
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          {Math.floor(duration / 60)}h {duration % 60}m
                        </span>
                      </div>
                    )}
                    {data.rating && (
                      <div className="flex items-center gap-1.5">
                        <StarIcon className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span>{data.rating.toFixed(1)}/10</span>
                      </div>
                    )}
                    <div className="px-3 py-1 bg-white/10 rounded-full">
                      {data.type === "MOVIE"
                        ? "Movie"
                        : data.type === "TV_SHOW"
                          ? "TV Show"
                          : data.type}
                    </div>
                  </div>
                </motion.div>

                {/* Genres */}
                {data.genres && data.genres.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                    className="flex flex-wrap gap-2"
                  >
                    {data.genres.map(
                      (g: { id?: string; genre?: { name?: string } }) => (
                        <span
                          key={g.id}
                          className="px-3 py-1 bg-neutral-900/60 backdrop-blur-lg border border-white/10 rounded-full text-xs text-white/80"
                        >
                          {g.genre?.name}
                        </span>
                      )
                    )}
                  </motion.div>
                )}

                {/* Action Buttons */}
                {data.type === "MOVIE" && data.movie && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
                  >
                    <button
                      onClick={playMovie}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
                    >
                      <PlayIcon className="w-5 h-5 fill-current" />
                      <span>Play</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-7xl mx-auto px-8 lg:px-12 mt-12 space-y-12">
        {/* Description */}
        {data.description && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold text-white">Overview</h2>
            <p className="text-white/70 text-lg leading-relaxed max-w-4xl">
              {data.description}
            </p>
          </motion.section>
        )}

        {/* TV Show Seasons */}
        {data.type === "TV_SHOW" && data.tvShow?.seasons && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-white">Seasons</h2>
            <div className="space-y-3">
              {data.tvShow.seasons
                .sort(
                  (a: { number?: number }, b: { number?: number }) =>
                    (a.number ?? 0) - (b.number ?? 0)
                )
                .map(
                  (season: {
                    id?: string;
                    number?: number;
                    episodes?: Array<{
                      id?: string;
                      title?: string;
                      number?: number;
                      duration?: number | null;
                      filePath?: string;
                    }>;
                  }) => {
                    const isExpanded = expandedSeasonId === season.id;
                    // Sort episodes by episode number
                    const episodes = (season.episodes || []).sort(
                      (a, b) => (a.number ?? 0) - (b.number ?? 0)
                    );

                    return (
                      <div
                        key={season.id}
                        className="bg-neutral-900/40 backdrop-blur-lg border border-neutral-800/40 rounded-2xl overflow-hidden"
                      >
                        {/* Season Header */}
                        <button
                          onClick={() =>
                            setExpandedSeasonId(
                              isExpanded ? null : (season.id ?? null)
                            )
                          }
                          className="w-full p-6 flex items-center justify-between hover:bg-neutral-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-white">
                              Season {season.number}
                            </h3>
                            <span className="text-sm text-white/60">
                              {episodes.length}{" "}
                              {episodes.length === 1 ? "episode" : "episodes"}
                            </span>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDownIcon className="w-5 h-5 text-white/60" />
                          </motion.div>
                        </button>

                        {/* Episodes List */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-neutral-800/40">
                                {episodes.length > 0 ? (
                                  <div className="divide-y divide-neutral-800/40">
                                    {episodes.map(
                                      (episode: {
                                        id?: string;
                                        title?: string;
                                        number?: number;
                                        duration?: number | null;
                                        filePath?: string;
                                      }) => (
                                        <div
                                          key={episode.id}
                                          className="p-6 hover:bg-neutral-900/30 transition-colors"
                                        >
                                          <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0 w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
                                              <span className="text-white/60 font-semibold">
                                                {episode.number}
                                              </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="text-white font-medium">
                                                {episode.title ||
                                                  `Episode ${episode.number}`}
                                              </h4>
                                              {episode.duration && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-white/40">
                                                  <ClockIcon className="w-3 h-3" />
                                                  <span>
                                                    {episode.duration} min
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            {episode.filePath &&
                                              season.number !== undefined &&
                                              episode.number !== undefined && (
                                                <button
                                                  onClick={() =>
                                                    playEpisode(
                                                      season.number!,
                                                      episode.number!,
                                                      episode.title
                                                    )
                                                  }
                                                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                                >
                                                  <PlayIcon className="w-5 h-5 fill-current text-white" />
                                                </button>
                                              )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-6 text-center text-white/40">
                                    No episodes available
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                )}
            </div>
          </motion.section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-white">Cast</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {cast.slice(0, 10).map(
                (member: {
                  id?: string;
                  character?: string | null;
                  person?: {
                    name?: string;
                    profileUrl?: string | null;
                  };
                }) => (
                  <div key={member.id} className="space-y-3">
                    <div className="aspect-square bg-neutral-800 rounded-2xl overflow-hidden">
                      {member.person?.profileUrl ? (
                        <img
                          src={member.person.profileUrl}
                          alt={member.person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <UserIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {member.person?.name}
                      </p>
                      {member.character && (
                        <p className="text-white/50 text-xs mt-1">
                          {member.character}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </motion.section>
        )}

        {/* Directors */}
        {directors.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold text-white">Director</h2>
            <div className="flex flex-wrap gap-3">
              {directors.map(
                (director: {
                  id?: string;
                  person?: {
                    name?: string;
                  };
                }) => (
                  <div
                    key={director.id}
                    className="px-4 py-2 bg-neutral-900/40 backdrop-blur-lg border border-neutral-800/40 rounded-full"
                  >
                    <span className="text-white/80">
                      {director.person?.name}
                    </span>
                  </div>
                )
              )}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
