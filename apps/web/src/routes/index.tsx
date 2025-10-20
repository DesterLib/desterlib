import { createFileRoute, useNavigate } from "@tanstack/react-router";
import MediaCard from "../components/custom/mediaCard";
import { useMovies } from "../hooks/api/useMovies";
import { useTVShows } from "../hooks/api/useTVShows";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  const {
    data: movies,
    isLoading: moviesLoading,
    error: moviesError,
  } = useMovies();
  const {
    data: tvShows,
    isLoading: tvShowsLoading,
    error: tvShowsError,
  } = useTVShows();

  // Always show something, even if APIs fail
  const showMovies = !moviesLoading && !moviesError && movies;
  const showTVShows = !tvShowsLoading && !tvShowsError && tvShows;

  return (
    <div className="max-w-[1440px] mx-auto px-6 flex gap-16 flex-col pt-[120px]">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl">Movies</h2>
        {moviesLoading && <p className="text-foreground">Loading movies...</p>}
        {moviesError && (
          <div className="text-red-500 bg-red-50 p-4 rounded">
            <p>Error loading movies: {moviesError.message}</p>
            <p className="text-sm mt-2">
              This might be due to API server not running.
            </p>
          </div>
        )}
        {showMovies ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-6">
            {movies.map((movie) => (
              <MediaCard
                key={movie.id}
                focusKey={`media-card-${movie.id}`}
                title={movie.media.title}
                year={
                  movie.media.releaseDate
                    ? new Date(movie.media.releaseDate).getFullYear().toString()
                    : ""
                }
                imageUrl={
                  movie.media.backdropUrl || movie.media.posterUrl || undefined
                }
                onClick={() => navigate({ to: `/movie/${movie.id}` })}
              />
            ))}
          </div>
        ) : (
          <div className="text-foreground/60 p-8 text-center">
            No movies available. Make sure your API server is running.
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl">TV Shows</h2>
        {tvShowsLoading && (
          <p className="text-foreground">Loading TV shows...</p>
        )}
        {tvShowsError && (
          <div className="text-red-500 bg-red-50 p-4 rounded">
            <p>Error loading TV shows: {tvShowsError.message}</p>
            <p className="text-sm mt-2">
              This might be due to API server not running.
            </p>
          </div>
        )}
        {showTVShows ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-6">
            {tvShows.map((tvShow) => (
              <MediaCard
                key={tvShow.id}
                focusKey={`media-card-${tvShow.id}`}
                title={tvShow.media.title}
                year={
                  tvShow.media.releaseDate
                    ? new Date(tvShow.media.releaseDate)
                        .getFullYear()
                        .toString()
                    : ""
                }
                imageUrl={
                  tvShow.media.backdropUrl ||
                  tvShow.media.posterUrl ||
                  undefined
                }
                onClick={() => navigate({ to: `/tvshow/${tvShow.id}` })}
              />
            ))}
          </div>
        ) : (
          <div className="text-foreground/60 p-8 text-center">
            No TV shows available. Make sure your API server is running.
          </div>
        )}
      </div>
    </div>
  );
}
