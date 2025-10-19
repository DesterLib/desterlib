import { createFileRoute } from "@tanstack/react-router";
import { useMovieById } from "@/hooks/api/useMovies";
import { Icon } from "@repo/ui/components/icon";
import { Button } from "@repo/ui/components/button";

export const Route = createFileRoute("/movie/$")({
  component: RouteComponent,
});

function RouteComponent() {
  const { _splat } = Route.useParams();
  const id = _splat || "";
  const { data: movie, isLoading, error } = useMovieById(id);

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Invalid movie ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading movie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Error loading movie: {error.message}</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Movie not found</p>
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
            src={movie.media.backdropUrl || ""}
            alt={movie.media.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <h1 className="text-6xl md:text-7xl font-bold text-white">
              {movie.media.title}
            </h1>
            <div className="flex items-center gap-3">
              <div className="text-sm rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                MOVIE
              </div>
              {movie.media.rating && (
                <div className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Icon name="star" size={16} className="text-yellow-400" />
                  <span>{movie.media.rating.toFixed(1)}</span>
                </div>
              )}
              {movie.duration && (
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {formatDuration(movie.duration)}
                </div>
              )}
              {movie.media.releaseDate && (
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {new Date(movie.media.releaseDate).getFullYear()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Actions */}
          <div className="flex flex-col gap-6 lg:w-1/3">
            {/* Play Button */}
            <Button
              variant="primary"
              icon="play_arrow"
              iconSize={28}
              iconFilled
              iconClassName="text-black"
            >
              Play Movie
            </Button>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                icon="favorite"
                iconSize={20}
              >
                Add to List
              </Button>
              {movie.trailerUrl && (
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  icon="play_circle"
                  iconSize={20}
                >
                  Trailer
                </Button>
              )}
            </div>

            {/* Movie Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Movie Details</h3>
              <div className="space-y-3">
                {movie.media.releaseDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Release Date</span>
                    <span>{formatDate(movie.media.releaseDate)}</span>
                  </div>
                )}
                {movie.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration</span>
                    <span>{formatDuration(movie.duration)}</span>
                  </div>
                )}
                {movie.media.rating && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating</span>
                    <div className="flex items-center gap-1">
                      <Icon
                        name="star"
                        size={16}
                        filled
                        className="text-yellow-400"
                      />
                      <span>{movie.media.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {movie.fileSize && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">File Size</span>
                    <span>{formatFileSize(movie.fileSize)}</span>
                  </div>
                )}
                {movie.fileModifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Added</span>
                    <span>{formatDate(movie.fileModifiedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:w-2/3 space-y-8">
            {/* Description */}
            {movie.media.description && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Overview</h3>
                <p className="text-gray-300 leading-relaxed text-base">
                  {movie.media.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
