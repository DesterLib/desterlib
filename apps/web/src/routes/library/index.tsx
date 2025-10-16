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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export const Route = createFileRoute("/library/")({
  component: RouteComponent,
  beforeLoad: async () => {
    // Require authentication to view library
    await requireAuth();
  },
});

// Demo data - 10 items with movies and TV shows
const demoLibraryItems = [
  {
    id: "1",
    title: "The Matrix",
    year: 1999,
    type: "movie" as const,
    image: "/placeholder.png",
    genre: "Sci-Fi",
  },
  {
    id: "2",
    title: "Breaking Bad",
    year: 2008,
    type: "tvshow" as const,
    image: "/placeholder.png",
    genre: "Drama",
  },
  {
    id: "3",
    title: "Inception",
    year: 2010,
    type: "movie" as const,
    image: "/placeholder.png",
    genre: "Sci-Fi",
  },
  {
    id: "4",
    title: "Stranger Things",
    year: 2016,
    type: "tvshow" as const,
    image: "/placeholder.png",
    genre: "Sci-Fi",
  },
  {
    id: "5",
    title: "Interstellar",
    year: 2014,
    type: "movie" as const,
    image: "/placeholder.png",
    genre: "Sci-Fi",
  },
  {
    id: "6",
    title: "The Crown",
    year: 2016,
    type: "tvshow" as const,
    image: "/placeholder.png",
    genre: "Drama",
  },
  {
    id: "7",
    title: "The Dark Knight",
    year: 2008,
    type: "movie" as const,
    image: "/placeholder.png",
    genre: "Action",
  },
  {
    id: "8",
    title: "Game of Thrones",
    year: 2011,
    type: "tvshow" as const,
    image: "/placeholder.png",
    genre: "Fantasy",
  },
  {
    id: "9",
    title: "Pulp Fiction",
    year: 1994,
    type: "movie" as const,
    image: "/placeholder.png",
    genre: "Crime",
  },
  {
    id: "10",
    title: "The Mandalorian",
    year: 2019,
    type: "tvshow" as const,
    image: "/placeholder.png",
    genre: "Sci-Fi",
  },
];

type SortOption =
  | "title-asc"
  | "title-desc"
  | "year-newest"
  | "year-oldest"
  | "genre-asc";

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "movie" | "tvshow">(
    "all"
  );
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const genreMenuRef = useRef<HTMLDivElement>(null);

  // Get unique genres from demo data
  const availableGenres = useMemo(() => {
    const genres = new Set(demoLibraryItems.map((item) => item.genre));
    return Array.from(genres).sort();
  }, []);

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

  // Filter and sort items based on all criteria
  const filteredItems = useMemo(() => {
    let items = [...demoLibraryItems];

    // Filter by type
    if (filterType !== "all") {
      items = items.filter((item) => item.type === filterType);
    }

    // Filter by genre
    if (selectedGenres.length > 0) {
      items = items.filter((item) => selectedGenres.includes(item.genre));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.genre.toLowerCase().includes(query)
      );
    }

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "year-newest":
          return b.year - a.year;
        case "year-oldest":
          return a.year - b.year;
        case "genre-asc":
          return a.genre.localeCompare(b.genre);
        default:
          return 0;
      }
    });

    return items;
  }, [searchQuery, filterType, sortBy, selectedGenres]);

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
      case "genre-asc":
        return "Genre (A-Z)";
      default:
        return "Sort";
    }
  };

  const getTypeLabel = () => {
    switch (filterType) {
      case "all":
        return "All Types";
      case "movie":
        return "Movies";
      case "tvshow":
        return "TV Shows";
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
    <div className="pt-[100px] px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Library</h1>
          <p className="text-white/60">
            Browse and search your media collection
          </p>
        </div>

        {/* Search Bar and Filter Controls */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div
                className={cn(
                  "relative flex items-center bg-neutral-900/60 backdrop-blur-lg border rounded-2xl transition-all duration-300",
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
                            setFilterType("movie");
                            setShowTypeMenu(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2",
                            filterType === "movie"
                              ? "bg-white/10 text-white"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <Film className="w-4 h-4" />
                          Movies
                        </button>
                        <button
                          onClick={() => {
                            setFilterType("tvshow");
                            setShowTypeMenu(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2",
                            filterType === "tvshow"
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
                  <span className="text-white text-sm">{getGenreLabel()}</span>
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
                          { value: "genre-asc", label: "Genre (A-Z)" },
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
              <button
                onClick={() => setShowMobileDrawer(true)}
                className={cn(
                  "relative flex items-center gap-2 h-12 px-4 bg-neutral-900/60 backdrop-blur-lg border rounded-2xl transition-all duration-200 hover:border-white/30",
                  activeFiltersCount > 0 ? "border-white/30" : "border-white/10"
                )}
              >
                <SlidersHorizontal className="w-4 h-4 text-white/60" />
                <span className="text-white text-sm">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs bg-white text-black rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-3">
          <p className="text-white/60 text-sm">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"} found
          </p>
        </div>

        {/* Grid of Items */}
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    title={item.title}
                    year={item.year}
                    image={item.image}
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
                    onClick={() => setFilterType("movie")}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2",
                      filterType === "movie"
                        ? "bg-white text-black border-white"
                        : "bg-neutral-900/60 text-white/70 border-white/10 hover:border-white/30"
                    )}
                  >
                    <Film className="w-4 h-4" />
                    Movies
                  </button>
                  <button
                    onClick={() => setFilterType("tvshow")}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2",
                      filterType === "tvshow"
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
                    { value: "genre-asc", label: "Genre (A-Z)" },
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
