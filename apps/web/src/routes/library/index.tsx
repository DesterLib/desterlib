import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-guards";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  SearchIcon,
  XIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Film,
  Tv,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMedia } from "@/lib/hooks";
import type { MediaType } from "@dester/api-client";

export const Route = createFileRoute("/library/")({
  component: RouteComponent,
  beforeLoad: async () => {
    // Require authentication to view library
    await requireAuth();
  },
});

type FilterType = "all" | MediaType;
type SortOption = "title-asc" | "title-desc" | "year-newest" | "year-oldest";

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const genreMenuRef = useRef<HTMLDivElement>(null);

  // Fetch media from API with filters
  const {
    data: mediaData,
    isLoading,
    error,
  } = useMedia({
    type: filterType !== "all" ? filterType : undefined,
    search: searchQuery || undefined,
    limit: 100,
  });

  const allMedia = useMemo(() => mediaData?.media || [], [mediaData?.media]);

  // Get unique genres from media data
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    allMedia.forEach((item) => {
      item.genres?.forEach((mg) => {
        if (mg.genre?.name) {
          genresSet.add(mg.genre.name);
        }
      });
    });
    return Array.from(genresSet).sort();
  }, [allMedia]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setShowSortMenu(false);
      }
      if (
        typeMenuRef.current &&
        !typeMenuRef.current.contains(event.target as Node)
      ) {
        setShowTypeMenu(false);
      }
      if (
        genreMenuRef.current &&
        !genreMenuRef.current.contains(event.target as Node)
      ) {
        setShowGenreMenu(false);
      }
    };

    if (showSortMenu || showTypeMenu || showGenreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSortMenu, showTypeMenu, showGenreMenu]);

  // Filter and sort items based on all criteria (client-side filtering for genres)
  const filteredItems = useMemo(() => {
    let items = [...allMedia];

    // Filter by genre (client-side since API doesn't support multiple genres)
    if (selectedGenres.length > 0) {
      items = items.filter((item) =>
        item.genres?.some((mg) => selectedGenres.includes(mg.genre?.name || ""))
      );
    }

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "year-newest": {
          const aYear = a.releaseDate
            ? new Date(a.releaseDate).getFullYear()
            : 0;
          const bYear = b.releaseDate
            ? new Date(b.releaseDate).getFullYear()
            : 0;
          return bYear - aYear;
        }
        case "year-oldest": {
          const aYear = a.releaseDate
            ? new Date(a.releaseDate).getFullYear()
            : 0;
          const bYear = b.releaseDate
            ? new Date(b.releaseDate).getFullYear()
            : 0;
          return aYear - bYear;
        }
        default:
          return 0;
      }
    });

    return items;
  }, [allMedia, sortBy, selectedGenres]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleToggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleClearAllFilters = () => {
    setFilterType("all");
    setSelectedGenres([]);
    setSortBy("title-asc");
    setSearchQuery("");
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "title-asc":
        return "Title (A-Z)";
      case "title-desc":
        return "Title (Z-A)";
      case "year-newest":
        return "Newest First";
      case "year-oldest":
        return "Oldest First";
      default:
        return "Sort";
    }
  };

  const getTypeLabel = () => {
    switch (filterType) {
      case "all":
        return "All Types";
      case "MOVIE":
        return "Movies";
      case "TV_SHOW":
        return "TV Shows";
      case "MUSIC":
        return "Music";
      case "COMIC":
        return "Comics";
      default:
        return "Type";
    }
  };

  const getGenreLabel = () => {
    if (selectedGenres.length === 0) return "All Genres";
    if (selectedGenres.length === 1) return selectedGenres[0];
    return `${selectedGenres.length} Genres`;
  };

  const activeFiltersCount =
    (filterType !== "all" ? 1 : 0) +
    selectedGenres.length +
    (sortBy !== "title-asc" ? 1 : 0);

  return (
    <div className="md:pt-[100px] pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg p-4">
          {/* Search Bar and Filter Controls */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div
                  className={cn(
                    "relative flex items-center bg-neutral-900/60 backdrop-blur-lg border rounded-[50px] transition-all duration-300",
                    isSearchFocused
                      ? "border-white/30 ring-2 ring-white/10"
                      : "border-white/10"
                  )}
                >
                  <div className="pl-4 pr-2 flex items-center">
                    <SearchIcon className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search by title or genre..."
                    className="flex-1 h-12 bg-transparent text-white outline-none placeholder:text-white/40"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={handleClearSearch}
                        className="mr-2 p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <XIcon className="w-4 h-4 text-white/60" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Filter Controls - Desktop */}
              <div className="hidden md:flex items-center gap-2">
                {/* Type Dropdown */}
                <div className="relative" ref={typeMenuRef}>
                  <button
                    onClick={() => {
                      setShowTypeMenu(!showTypeMenu);
                      setShowSortMenu(false);
                      setShowGenreMenu(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 h-12 px-4 bg-neutral-900/60 backdrop-blur-lg border rounded-2xl transition-all duration-200 hover:border-white/30",
                      showTypeMenu ? "border-white/30" : "border-white/10"
                    )}
                  >
                    <Film className="w-4 h-4 text-white/60" />
                    <span className="text-white text-sm">{getTypeLabel()}</span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </button>

                  <AnimatePresence>
                    {showTypeMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setFilterType("all");
                              setShowTypeMenu(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-sm transition-colors",
                              filterType === "all"
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            All Types
                          </button>
                          <button
                            onClick={() => {
                              setFilterType("MOVIE");
                              setShowTypeMenu(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2",
                              filterType === "MOVIE"
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <Film className="w-4 h-4" />
                            Movies
                          </button>
                          <button
                            onClick={() => {
                              setFilterType("TV_SHOW");
                              setShowTypeMenu(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2",
                              filterType === "TV_SHOW"
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <Tv className="w-4 h-4" />
                            TV Shows
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Genre Dropdown */}
                <div className="relative" ref={genreMenuRef}>
                  <button
                    onClick={() => {
                      setShowGenreMenu(!showGenreMenu);
                      setShowSortMenu(false);
                      setShowTypeMenu(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 h-12 px-4 bg-neutral-900/60 backdrop-blur-lg border rounded-2xl transition-all duration-200 hover:border-white/30",
                      showGenreMenu ? "border-white/30" : "border-white/10"
                    )}
                  >
                    <SlidersHorizontal className="w-4 h-4 text-white/60" />
                    <span className="text-white text-sm">
                      {getGenreLabel()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                    {selectedGenres.length > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 text-xs bg-white text-black rounded-full">
                        {selectedGenres.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showGenreMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setSelectedGenres([]);
                              setShowGenreMenu(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-sm transition-colors",
                              selectedGenres.length === 0
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            All Genres
                          </button>
                          <div className="border-t border-white/10 my-1" />
                          {availableGenres.map((genre) => (
                            <button
                              key={genre}
                              onClick={() => handleToggleGenre(genre)}
                              className={cn(
                                "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between",
                                selectedGenres.includes(genre)
                                  ? "bg-white/10 text-white"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              {genre}
                              {selectedGenres.includes(genre) && (
                                <span className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sort Dropdown */}
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => {
                      setShowSortMenu(!showSortMenu);
                      setShowTypeMenu(false);
                      setShowGenreMenu(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 h-12 px-4 bg-neutral-900/60 backdrop-blur-lg border rounded-2xl transition-all duration-200 hover:border-white/30",
                      showSortMenu ? "border-white/30" : "border-white/10"
                    )}
                  >
                    <ArrowUpDown className="w-4 h-4 text-white/60" />
                    <span className="text-white text-sm">
                      {getSortLabel(sortBy)}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </button>

                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="py-2">
                          {[
                            { value: "title-asc", label: "Title (A-Z)" },
                            { value: "title-desc", label: "Title (Z-A)" },
                            { value: "year-newest", label: "Newest First" },
                            { value: "year-oldest", label: "Oldest First" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value as SortOption);
                                setShowSortMenu(false);
                              }}
                              className={cn(
                                "w-full px-4 py-2.5 text-left text-sm transition-colors",
                                sortBy === option.value
                                  ? "bg-white/10 text-white"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clear Filters Button */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearAllFilters}
                    className="flex items-center gap-2 h-12 px-4 bg-neutral-900/60 backdrop-blur-lg border border-white/10 rounded-2xl transition-all duration-200 hover:border-white/30 hover:bg-white/5"
                  >
                    <XIcon className="w-4 h-4 text-white/60" />
                    <span className="text-white text-sm">Clear</span>
                  </button>
                )}
              </div>

              {/* Filter Controls - Mobile */}
              <div className="flex md:hidden items-center gap-2">
                <Button
                  onClick={() => setShowMobileDrawer(true)}
                  variant="default"
                  className="w-12 h-12 lg:w-auto"
                >
                  <SlidersHorizontal className="w-4 h-4 text-white/60" />
                  <span className="text-white text-sm hidden lg:block">
                    Filters
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs bg-white text-black rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
          {/* Results Count */}
          <div>
            <p className="text-white/60 text-sm">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"} found
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-white/40 animate-spin mb-4" />
            <p className="text-white/60">Loading your media library...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-red-900/20 backdrop-blur-lg border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
              <XIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Failed to load library
              </h3>
              <p className="text-white/60 text-sm">
                {error instanceof Error
                  ? error.message
                  : "An error occurred while loading your media."}
              </p>
            </div>
          </div>
        )}

        {/* Grid of Items */}
        {!isLoading && !error && (
          <AnimatePresence mode="popLayout">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    layoutId={item.id}
                  >
                    <Card
                      title={item.title || "Untitled"}
                      year={
                        item.releaseDate
                          ? new Date(item.releaseDate).getFullYear()
                          : 0
                      }
                      image={item.posterUrl || "/placeholder.png"}
                      onClick={() => {
                        // TODO: Navigate to media detail page
                        console.log("Clicked:", item.id);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-neutral-900/60 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center max-w-md">
                  <SearchIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No items found
                  </h3>
                  <p className="text-white/60 text-sm">
                    Try adjusting your search or filters to find what you're
                    looking for.
                  </p>
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="mt-4 px-4 py-2 bg-neutral-800/60 hover:bg-neutral-800 text-white rounded-xl transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Mobile Filters Drawer */}
        <Drawer open={showMobileDrawer} onOpenChange={setShowMobileDrawer}>
          <DrawerContent className="bg-neutral-950/95 backdrop-blur-xl border-white/10">
            <DrawerHeader>
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-white text-lg font-semibold">
                  Filters & Sort
                </DrawerTitle>
                <DrawerClose asChild>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <XIcon className="w-5 h-5 text-white/60" />
                  </button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-3 block">
                  Media Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border",
                      filterType === "all"
                        ? "bg-white text-black border-white"
                        : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType("MOVIE")}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2",
                      filterType === "MOVIE"
                        ? "bg-white text-black border-white"
                        : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                    )}
                  >
                    <Film className="w-4 h-4" />
                    Movies
                  </button>
                  <button
                    onClick={() => setFilterType("TV_SHOW")}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2",
                      filterType === "TV_SHOW"
                        ? "bg-white text-black border-white"
                        : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                    )}
                  >
                    <Tv className="w-4 h-4" />
                    TV Shows
                  </button>
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-3 block">
                  Genres
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleToggleGenre(genre)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                        selectedGenres.includes(genre)
                          ? "bg-white text-black border-white"
                          : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-3 block">
                  Sort By
                </label>
                <div className="space-y-2">
                  {[
                    { value: "title-asc", label: "Title (A-Z)" },
                    { value: "title-desc", label: "Title (Z-A)" },
                    { value: "year-newest", label: "Newest First" },
                    { value: "year-oldest", label: "Oldest First" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortOption)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 border",
                        sortBy === option.value
                          ? "bg-white text-black border-white"
                          : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    handleClearAllFilters();
                    setShowMobileDrawer(false);
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 text-white rounded-xl transition-colors border border-white/10"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="flex-1 px-4 py-3 bg-white hover:bg-white/90 text-black rounded-xl transition-colors font-medium"
              >
                Show Results ({filteredItems.length})
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
