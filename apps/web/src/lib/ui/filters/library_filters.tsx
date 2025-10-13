import {
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
  ChevronDownIcon,
} from "lucide-preact";
import { useState } from "preact/hooks";
import { motion, AnimatePresence } from "motion/react";

interface LibraryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "name" | "createdAt" | "mediaCount" | "updatedAt";
  onSortChange: (
    sort: "name" | "createdAt" | "mediaCount" | "updatedAt"
  ) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  mediaTypeFilter: "all" | "MOVIE" | "TV_SHOW";
  onMediaTypeChange: (type: "all" | "MOVIE" | "TV_SHOW") => void;
}

export default function LibraryFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  mediaTypeFilter,
  onMediaTypeChange,
}: LibraryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const clearFilters = () => {
    onSearchChange("");
    onSortChange("createdAt");
    onSortOrderChange("desc");
    onMediaTypeChange("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    sortBy !== "createdAt" ||
    sortOrder !== "asc" ||
    mediaTypeFilter !== "all";

  return (
    <div className="mb-6 fixed left-4 right-4 top-6 md:sticky md:top-[92px] z-50 max-w-[1280px] mx-auto">
      {/* Search Bar */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative h-12 bg-neutral-900/80 backdrop-blur-lg border border-white/10 rounded-[50px]">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onInput={(e) =>
              onSearchChange((e.target as HTMLInputElement).value)
            }
            placeholder="Search movies, shows, collections..."
            className="w-full h-full pl-12 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XIcon className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`h-12 w-12 md:w-fit md:px-4 rounded-[50px] backdrop-blur-lg border transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap relative ${
            isExpanded || hasActiveFilters
              ? "bg-white/10 border-white/20 text-white"
              : "bg-neutral-900/80 border-white/10 text-white/60 hover:border-white/20 hover:text-white"
          }`}
        >
          <SlidersHorizontalIcon className="w-5 h-5" />
          <span className="hidden md:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-3 h-3 top-0 right-0 absolute bg-blue-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-neutral-900/80 backdrop-blur-lg border border-white/10 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sort By */}
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        onSortChange(
                          (e.target as HTMLSelectElement).value as
                            | "name"
                            | "createdAt"
                            | "mediaCount"
                            | "updatedAt"
                        )
                      }
                      className="w-full px-3 py-2 pr-10 bg-neutral-900/80 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer hover:bg-white/10 [&>option]:bg-zinc-900 [&>option]:text-white"
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="updatedAt">Last Updated</option>
                      <option value="name">Name</option>
                      <option value="mediaCount">Media Count</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Order
                  </label>
                  <div className="relative">
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        onSortOrderChange(
                          (e.target as HTMLSelectElement).value as
                            | "asc"
                            | "desc"
                        )
                      }
                      className="w-full px-3 py-2 pr-10 bg-neutral-900/80 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer hover:bg-white/10 [&>option]:bg-zinc-900 [&>option]:text-white"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Media Type Filter */}
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Media Type
                  </label>
                  <div className="relative">
                    <select
                      value={mediaTypeFilter}
                      onChange={(e) =>
                        onMediaTypeChange(
                          (e.target as HTMLSelectElement).value as
                            | "all"
                            | "MOVIE"
                            | "TV_SHOW"
                        )
                      }
                      className="w-full px-3 py-2 pr-10 bg-neutral-900/80 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer hover:bg-white/10 [&>option]:bg-zinc-900 [&>option]:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="MOVIE">Movies</option>
                      <option value="TV_SHOW">TV Shows</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <XIcon className="w-4 h-4" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
