import { useState, useEffect } from "preact/hooks";
import { Animated } from "../../animation";
import ExpandableRow from "../expandable_row";
import { api, type Media } from "../../api/client";

interface HomeProps {
  onMediaSelect: (id: string) => void;
}

export default function Home({ onMediaSelect }: HomeProps) {
  const [movies, setMovies] = useState<Media[]>([]);
  const [tvShows, setTvShows] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch movies and TV shows on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [moviesResponse, tvShowsResponse] = await Promise.all([
          api.movies.getAll({
            limit: 50,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
          api.tvShows.getAll({
            limit: 50,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        ]);

        if (moviesResponse.success && moviesResponse.data) {
          setMovies(moviesResponse.data.media);
        } else if (!moviesResponse.success) {
          setError(moviesResponse.error.message);
        }

        if (tvShowsResponse.success && tvShowsResponse.data) {
          setTvShows(tvShowsResponse.data.media);
        } else if (!tvShowsResponse.success && !error) {
          setError(tvShowsResponse.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Animated show={true} preset="fade" duration={300}>
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white/80 mb-4"></div>
            <p className="text-white/60 text-lg">Loading media...</p>
          </div>
        </Animated>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Animated show={true} preset="fadeScale" duration={300}>
          <div className="text-center max-w-md px-4">
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
      </div>
    );
  }

  const hasContent = movies.length > 0 || tvShows.length > 0;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-12">
      <Animated show={true} preset="fade" duration={500}>
        {!hasContent ? (
          <div className="text-center py-16 px-4">
            <div className="text-white/40 text-6xl mb-4">🎬</div>
            <h2 className="text-white text-2xl font-semibold mb-2">
              No media yet
            </h2>
            <p className="text-white/60">
              Start scanning your media to see movies and TV shows here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="max-w-[1280px] mx-auto w-full">
              <div className="text-white text-3xl font-semibold">Home</div>
            </div>
            {/* Movies Section */}
            {movies.length > 0 && (
              <ExpandableRow
                title={`${movies.length} ${movies.length === 1 ? "Movie" : "Movies"}`}
                items={movies.map((media) => ({
                  id: media.id,
                  title: media.title,
                  year: media.releaseDate
                    ? new Date(media.releaseDate).getFullYear()
                    : undefined,
                  image:
                    media.backdropUrl ||
                    media.posterUrl ||
                    "https://via.placeholder.com/1280x720/1a1a1a/666666?text=No+Image",
                }))}
                onItemClick={onMediaSelect}
              />
            )}

            {/* TV Shows Section */}
            {tvShows.length > 0 && (
              <ExpandableRow
                title={`${tvShows.length === 1 ? "TV Show" : "TV Shows"}`}
                items={tvShows.map((media) => ({
                  id: media.id,
                  title: media.title,
                  year: media.releaseDate
                    ? new Date(media.releaseDate).getFullYear()
                    : undefined,
                  image:
                    media.backdropUrl ||
                    media.posterUrl ||
                    "https://via.placeholder.com/1280x720/1a1a1a/666666?text=No+Image",
                }))}
                onItemClick={onMediaSelect}
              />
            )}
          </div>
        )}
      </Animated>
    </div>
  );
}
