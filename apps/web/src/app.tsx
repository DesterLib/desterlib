import { useState, useRef, useEffect } from "preact/hooks";
import { AnimatedPresence, Animated } from "./lib/animation";
import ExpandableRow from "./lib/ui/expandable_row";
import DetailsDialog from "./lib/ui/details_dialog";
import { api, type Movie } from "./lib/api/client";

export function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMovie, setCurrentMovie] = useState<number | null>(null);

  // Fetch movies on mount
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);

      const response = await api.movies.getAll();

      if (response.success && response.data) {
        setMovies(response.data.movies);
      } else if (!response.success) {
        setError(response.error.message);
      }

      setLoading(false);
    };

    fetchMovies();
  }, []);

  // Keep a reference to the last selected movie for exit animation
  const lastSelectedMovieRef = useRef<(typeof movies)[0] | null>(null);

  const selectedMovie = movies.find((m) => m.id === currentMovie);
  const isDialogOpen = currentMovie !== null;

  // Update the ref when a movie is selected
  useEffect(() => {
    if (selectedMovie) {
      lastSelectedMovieRef.current = selectedMovie;
    }
  }, [selectedMovie]);

  // Use lastSelectedMovie for rendering during exit animation
  const movieToRender = selectedMovie || lastSelectedMovieRef.current;

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen lg:px-8 lg:py-12 px-2 py-8 bg-black flex items-center justify-center">
        <Animated show={true} preset="fade" duration={300}>
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white/80 mb-4"></div>
            <p className="text-white/60 text-lg">Loading movies...</p>
          </div>
        </Animated>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen lg:px-8 lg:py-12 px-2 py-8 bg-black flex items-center justify-center">
        <Animated show={true} preset="fadeScale" duration={300}>
          <div className="text-center max-w-md">
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
      </main>
    );
  }

  return (
    <main className="min-h-screen lg:px-8 lg:py-12 px-2 py-8 bg-black">
      <Animated show={true} preset="fade" duration={500}>
        <div className="flex flex-col gap-2 lg:gap-4">
          <ExpandableRow
            title="Movies"
            items={movies}
            setCurrentMovie={setCurrentMovie}
          />
          <ExpandableRow
            title="TV Shows"
            items={movies}
            setCurrentMovie={setCurrentMovie}
          />
        </div>
      </Animated>
      <AnimatedPresence show={isDialogOpen} exitDuration={300}>
        {movieToRender && (
          <DetailsDialog
            item={movieToRender}
            setCurrentMovie={setCurrentMovie}
            isOpen={isDialogOpen}
          />
        )}
      </AnimatedPresence>
    </main>
  );
}
