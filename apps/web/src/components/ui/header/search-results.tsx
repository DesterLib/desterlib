import { motion } from "motion/react";
import type { SearchResponse } from "@dester/api-client";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface SearchResultsProps {
  results?: SearchResponse;
  isLoading: boolean;
  query: string;
  filter: "all" | "movies" | "tvshows";
}

const SearchResults = ({
  results,
  isLoading,
  query,
  filter,
}: SearchResultsProps) => {
  const navigate = useNavigate();

  // Filter media based on the selected filter
  const filteredMedia =
    results?.media?.filter((item) => {
      if (filter === "movies") return item.type === "MOVIE";
      if (filter === "tvshows") return item.type === "TV_SHOW";
      return true; // "all" shows everything
    }) || [];

  const hasResults =
    results &&
    (filteredMedia.length > 0 ||
      (filter === "all" &&
        results.collections &&
        results.collections.length > 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full w-[calc(100%-32px)] left-0 right-0 mx-auto bg-neutral-900/95 backdrop-blur-lg border border-white/10rounded-3xl p-2 shadow-2xl max-h-[70vh] overflow-y-auto"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-neutral-400">Searching...</span>
        </div>
      )}

      {!isLoading && !hasResults && (
        <div className="text-center py-8">
          <p className="text-neutral-400">No results found for "{query}"</p>
        </div>
      )}

      {!isLoading && hasResults && (
        <div className="space-y-6">
          {filteredMedia.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white px-2">
                  {filter === "movies"
                    ? `Movies`
                    : filter === "tvshows"
                      ? `TV Shows`
                      : `Media`}
                </h3>
                <span className="text-xs text-neutral-400 px-4">
                  {filteredMedia.length}{" "}
                  {filteredMedia.length > 1 ? "results" : "result"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      navigate({
                        to: "/media/$mediaId",
                        params: { mediaId: item.id },
                      })
                    }
                    className="group cursor-pointer rounded-2xl overflow-hidden hover:bg-white/5 transition-colors duration-200"
                  >
                    <div className="flex gap-3 p-2">
                      {/* Thumbnail */}
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                        {item.backdropUrl ? (
                          <img
                            src={item.backdropUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-start pt-0.5 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-xs text-neutral-400 mt-1">
                          {item.type === "MOVIE" ? "Movie" : "TV Show"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filter === "all" &&
            results?.collections &&
            results.collections.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Collections ({results.collections.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="relative cursor-pointer group"
                    >
                      <div className="w-full aspect-video bg-neutral-800 rounded-lg shadow-lg group-hover:scale-105 group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-black group-hover:ring-white/20 group-hover:rounded-xl transition-all duration-200 ease-out flex items-center justify-center">
                        <span className="text-4xl">📁</span>
                      </div>
                      <div className="mt-2 group-hover:translate-y-2 ease-out opacity-90 transition-all duration-200">
                        <h2 className="text-sm font-semibold text-[#f5f5f7] m-0 leading-tight tracking-tight">
                          {collection.name}
                        </h2>
                        <p className="text-xs text-[#86868b] m-0 mt-0.5">
                          {collection.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </motion.div>
  );
};

export default SearchResults;
