import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-guards";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  SearchIcon,
  XIcon,
  SlidersHorizontal,
  Film,
  Tv,
  Loader2,
  Music,
  BookOpen,
  Grid3x3,
  ArrowUpDown,
  Calendar,
  CalendarDays,
  Tag,
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
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

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

  const activeFiltersCount =
    (filterType !== "all" ? 1 : 0) +
    selectedGenres.length +
    (sortBy !== "title-asc" ? 1 : 0);

  return (
    <div className="md:pt-[100px] pb-20 md:pb-0 md:h-[calc(100vh-100px)] md:px-6">
      <div className="max-w-7xl mx-auto md:flex md:gap-6 md:h-full">
        {/* Left Sidebar - Desktop Only */}
        <aside className="hidden md:block md:w-64 md:flex-shrink-0 md:h-full md:overflow-y-auto py-4">
          <div className="space-y-4">
            {/* Search */}
            <div
              className={cn(
                "relative flex items-center bg-white/5 border rounded-xl transition-all",
                isSearchFocused ? "border-white/20" : "border-white/10"
              )}
            >
              <div className="pl-3 pr-2 flex items-center">
                <SearchIcon className="w-4 h-4 text-white/40" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search..."
                className="flex-1 h-10 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClearSearch}
                    className="mr-2 p-1 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5 text-white/60" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Type Filter */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-white/10">
                <h3 className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  Media Type
                </h3>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    filterType === "all"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                  All
                </button>
                <button
                  onClick={() => setFilterType("MOVIE")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    filterType === "MOVIE"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Film className="w-4 h-4" />
                  Movies
                </button>
                <button
                  onClick={() => setFilterType("TV_SHOW")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    filterType === "TV_SHOW"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Tv className="w-4 h-4" />
                  TV Shows
                </button>
                <button
                  onClick={() => setFilterType("MUSIC")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    filterType === "MUSIC"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Music className="w-4 h-4" />
                  Music
                </button>
                <button
                  onClick={() => setFilterType("COMIC")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    filterType === "COMIC"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  Comics
                </button>
              </div>
            </div>

            {/* Genre Filter */}
            {availableGenres.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10">
                  <h3 className="text-xs font-medium text-white/60 uppercase tracking-wide flex items-center gap-2">
                    Genres
                    {selectedGenres.length > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 bg-white/10 text-white rounded">
                        {selectedGenres.length}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="p-2 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {availableGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleToggleGenre(genre)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        selectedGenres.includes(genre)
                          ? "bg-white text-black"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-white/10">
                <h3 className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  Sort By
                </h3>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => setSortBy("title-asc")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    sortBy === "title-asc"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <ArrowUpDown className="w-4 h-4 rotate-180" />
                  A-Z
                </button>
                <button
                  onClick={() => setSortBy("title-desc")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    sortBy === "title-desc"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  Z-A
                </button>
                <button
                  onClick={() => setSortBy("year-newest")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    sortBy === "year-newest"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <CalendarDays className="w-4 h-4" />
                  Newest
                </button>
                <button
                  onClick={() => setSortBy("year-oldest")}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center gap-2",
                    sortBy === "year-oldest"
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Oldest
                </button>
              </div>
            </div>

            {/* Clear All Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-white/10"
              >
                <XIcon className="w-4 h-4" />
                Reset ({activeFiltersCount})
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:h-full md:overflow-hidden flex flex-col">
          {/* Mobile Header - Search + Filter Button */}
          <div className="md:hidden sticky top-0 z-10 bg-background/80 backdrop-blur-lg p-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="flex-1">
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
                    placeholder="Search..."
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

              {/* Mobile Filter Button */}
              <Button
                onClick={() => setShowMobileDrawer(true)}
                variant="default"
                className="w-12 h-12 relative"
              >
                <SlidersHorizontal className="w-4 h-4 text-white/60" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs bg-white text-black rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="px-4 md:px-0 pb-2 md:pb-4 md:pt-4 flex-shrink-0">
            <p className="text-white/60 text-sm">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"} found
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 md:overflow-y-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-white/40 animate-spin mb-4" />
                <p className="text-white/60">Loading your media library...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 px-4">
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
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4">
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        layoutId={item.id}
                      >
                        <Link
                          to="/media/$mediaId"
                          params={{ mediaId: item.id || "" }}
                        >
                          <Card
                            title={item.title || "Untitled"}
                            year={
                              item.releaseDate
                                ? new Date(item.releaseDate).getFullYear()
                                : 0
                            }
                            image={item.posterUrl || "/placeholder.png"}
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="text-center">
                      <SearchIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No media found
                      </h3>
                      <p className="text-white/60 text-sm">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer open={showMobileDrawer} onOpenChange={setShowMobileDrawer}>
        <DrawerContent className="bg-neutral-900/95 backdrop-blur-xl border-t border-white/10">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-white text-lg font-semibold">
                Filters
              </DrawerTitle>
              <DrawerClose>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <XIcon className="w-5 h-5 text-white/60" />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <Grid3x3 className="w-4 h-4" />
                Media Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "px-3 py-3 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-2",
                    filterType === "all"
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                  All
                </button>
                <button
                  onClick={() => setFilterType("MOVIE")}
                  className={cn(
                    "px-3 py-3 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-2",
                    filterType === "MOVIE"
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                  )}
                >
                  <Film className="w-4 h-4" />
                  Movies
                </button>
                <button
                  onClick={() => setFilterType("TV_SHOW")}
                  className={cn(
                    "px-3 py-3 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-2",
                    filterType === "TV_SHOW"
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                  )}
                >
                  <Tv className="w-4 h-4" />
                  TV
                </button>
                <button
                  onClick={() => setFilterType("MUSIC")}
                  className={cn(
                    "px-3 py-3 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-2",
                    filterType === "MUSIC"
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                  )}
                >
                  <Music className="w-4 h-4" />
                  Music
                </button>
                <button
                  onClick={() => setFilterType("COMIC")}
                  className={cn(
                    "px-3 py-3 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-2",
                    filterType === "COMIC"
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  Comics
                </button>
              </div>
            </div>

            {/* Genre Filter */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Genres
                {selectedGenres.length > 0 && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 bg-white/10 text-white rounded">
                    {selectedGenres.length}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleToggleGenre(genre)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      selectedGenres.includes(genre)
                        ? "bg-white text-black"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Sort By
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSortBy("title-asc")}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors border flex items-center gap-2",
                    sortBy === "title-asc"
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                  )}
                >
                  <ArrowUpDown className="w-4 h-4 rotate-180" />
                  A-Z
                </button>
                <button
                  onClick={() => setSortBy("title-desc")}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors border flex items-center gap-2",
                    sortBy === "title-desc"
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                  )}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  Z-A
                </button>
                <button
                  onClick={() => setSortBy("year-newest")}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors border flex items-center gap-2",
                    sortBy === "year-newest"
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                  )}
                >
                  <CalendarDays className="w-4 h-4" />
                  Newest
                </button>
                <button
                  onClick={() => setSortBy("year-oldest")}
                  className={cn(
                    "w-full px-4 py-2 rounded-xl text-sm font-medium text-left transition-colors border flex items-center gap-2",
                    sortBy === "year-oldest"
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Oldest
                </button>
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
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors border border-white/10 font-medium flex items-center justify-center gap-2"
              >
                <XIcon className="w-4 h-4" />
                Reset
              </button>
            )}
            <button
              onClick={() => setShowMobileDrawer(false)}
              className="flex-1 px-4 py-3 bg-white hover:bg-white/90 text-black rounded-xl transition-colors font-medium"
            >
              Show {filteredItems.length}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
