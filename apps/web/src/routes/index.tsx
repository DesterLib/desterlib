import { createFileRoute, useNavigate } from "@tanstack/react-router";
import MediaCard from "../components/mediaCard";
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

  return (
    <div className="max-w-[1440px] mx-auto px-6 flex gap-16 flex-col pt-[120px]">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl">Movies</h2>
        {moviesLoading && <p>Loading movies...</p>}
        {moviesError && (
          <p className="text-red-500">
            Error loading movies: {moviesError.message}
          </p>
        )}
        {!moviesLoading && !moviesError && movies && (
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
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl">TV Shows</h2>
        {tvShowsLoading && <p>Loading TV shows...</p>}
        {tvShowsError && (
          <p className="text-red-500">
            Error loading TV shows: {tvShowsError.message}
          </p>
        )}
        {!tvShowsLoading && !tvShowsError && tvShows && (
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
        )}
      </div>
    </div>
  );
}
