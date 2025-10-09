import { useState } from "preact/hooks";
import { AnimatePresence, motion } from "motion/react";
import { XIcon } from "lucide-preact";
import extractColorsFromImage from "./lib/utils/extractColorsFromImage";
import ExpandableRow from "./lib/ui/expandableRow";

export function App() {
  const movies = [
    {
      id: 1,
      title: "Marco",
      year: 2024,
      image:
        "https://media.themoviedb.org/t/p/w1000_and_h563_face/fyT1X8DGW3MlwXjdAoZFCc183fZ.jpg",
    },
    {
      id: 2,
      title: "Demon Slayer: Kimetsu no Yaiba Infinity Castle",
      year: 2025,
      image:
        "https://media.themoviedb.org/t/p/w1000_and_h563_face/aI3Wz1F6ie9DY94jp5F42Yg5ZYK.jpg",
    },
    {
      id: 3,
      title: "Chainsaw Man - The Movie: Reze Arc",
      year: 2025,
      image:
        "https://media.themoviedb.org/t/p/w1000_and_h563_face/lprOhntOfoDRb5Hk5Y3JwwYq4TD.jpg",
    },
    {
      id: 4,
      title: "TRON: Ares",
      year: 2025,
      image:
        "https://media.themoviedb.org/t/p/w1000_and_h563_face/qY3MTxuYvAiuMZlVzQDvl1iI2Vr.jpg",
    },
    {
      id: 5,
      title: "TRON: Ares",
      year: 2025,
      image:
        "https://media.themoviedb.org/t/p/w1000_and_h563_face/qY3MTxuYvAiuMZlVzQDvl1iI2Vr.jpg",
    },
    {
      id: 6,
      title: "TRON: Ares",
      year: 2025,
      image:
        "https://media.themoviedb.org/t/p/w1000_and_h563_face/qY3MTxuYvAiuMZlVzQDvl1iI2Vr.jpg",
    },
  ];

  const [currentMovie, setCurrentMovie] = useState<number | null>(null);
  const [movieColors, setMovieColors] = useState<Record<number, string[]>>({});
  const [colorCacheOrder, setColorCacheOrder] = useState<number[]>([]);
  const [hoveredMovie, setHoveredMovie] = useState<number | null>(null);

  const MAX_CACHE_SIZE = 50;

  const handleExtractColors = (imageUrl: string, movieId: number) => {
    // If colors already exist, move to end (mark as recently used)
    if (movieColors[movieId]) {
      setColorCacheOrder((prev) => {
        const filtered = prev.filter((id) => id !== movieId);
        return [...filtered, movieId];
      });
      return;
    }

    extractColorsFromImage({
      imageUrl,
      colorCount: 4,
      format: "hex",
      onSuccess: (colors) => {
        setMovieColors((prev) => {
          const newColors = { ...prev };

          if (colorCacheOrder.length >= MAX_CACHE_SIZE) {
            const oldestId = colorCacheOrder[0];
            delete newColors[oldestId];
            console.log(
              `Cache full. Removing oldest colors for movie ${oldestId}`
            );
          }

          newColors[movieId] = colors;
          return newColors;
        });

        setColorCacheOrder((prev) => {
          const newOrder = [...prev];

          if (newOrder.length >= MAX_CACHE_SIZE) {
            newOrder.shift();
          }

          return [...newOrder, movieId];
        });
      },
      onError: (error) => {
        console.error(`Failed to extract colors for movie ${movieId}:`, error);
      },
    });
  };

  const selectedMovie = movies.find((m) => m.id === currentMovie);

  const hoveredColors = hoveredMovie ? movieColors[hoveredMovie] : null;

  return (
    <main className="min-h-screen lg:px-8 lg:py-12 px-2 py-8 bg-black relative">
      {/* Animated gradient backdrop */}
      <AnimatePresence>
        {hoveredColors && hoveredColors.length > 0 && (
          <motion.div
            key={hoveredMovie}
            className="fixed inset-0 pointer-events-none"
            style={{
              background:
                hoveredColors
                  .map((color, idx) => {
                    const positions = [
                      "at 0% 0%",
                      "at 100% 0%",
                      "at 100% 100%",
                      "at 0% 100%",
                    ];
                    return `radial-gradient(${positions[idx]}, ${color}40 0px, transparent 50%)`;
                  })
                  .join(", ") + ", transparent",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-2 lg:gap-4">
        {/* Grid of movie cards */}
        <ExpandableRow
          title="Movies"
          items={movies}
          setCurrentMovie={setCurrentMovie}
          setHoveredMovie={setHoveredMovie}
          handleExtractColors={handleExtractColors}
        />
        {/* Grid of movie cards */}
        <ExpandableRow
          title="TV Shows"
          items={movies}
          setCurrentMovie={setCurrentMovie}
          setHoveredMovie={setHoveredMovie}
          handleExtractColors={handleExtractColors}
        />
      </div>
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/85 backdrop-blur-[10px] flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCurrentMovie(null)}
          >
            <motion.div
              className="bg-[#1d1d1f] rounded-2xl max-w-[600px] w-[90%] shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.img
                src={selectedMovie.image}
                alt={selectedMovie.title}
                className="w-full aspect-video object-cover block"
              />
              <div className="p-6">
                <h2 className="text-[1.75rem] font-bold m-0 mb-2 text-[#f5f5f7] tracking-tight">
                  {selectedMovie.title}
                </h2>
                <p className="text-base text-[#86868b] m-0 mb-4">
                  {selectedMovie.year}
                </p>
                <button
                  onClick={() => setCurrentMovie(null)}
                  className="mt-4 px-6 py-3 rounded-lg border-none bg-[#0071e3] text-white cursor-pointer font-semibold text-sm transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.02]"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
