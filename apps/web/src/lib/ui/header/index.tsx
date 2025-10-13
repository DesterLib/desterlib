import { SearchIcon, XIcon, Loader2Icon } from "lucide-preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { motion, AnimatePresence } from "motion/react";
import { api, type Media, type Collection } from "../../api/client";

interface HeaderProps {
  onMediaSelect?: (mediaId: string) => void;
}

const Header = ({ onMediaSelect }: HeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    media?: Media[];
    collections?: Collection[];
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Debounce delay of 300ms
    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.search.query(searchQuery);
        if (response.success) {
          setSearchResults({
            media: response.data.media,
            collections: response.data.collections,
            total: response.data.total,
          });
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const openSearch = () => {
    setIsSearchOpen(true);
    setSearchQuery("");
    setSearchResults(null);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  };

  return (
    <div className="sticky top-0 z-50 mx-auto p-4">
      <motion.div
        initial={{ width: "fit-content" }}
        animate={{ width: isSearchOpen ? "100%" : "fit-content" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="border max-w-[600px] border-white/10 bg-black/40 backdrop-blur-lg rounded-[50px] font-semibold overflow-visible mx-auto relative"
      >
        <div className="flex items-center gap-2 px-2 py-2">
          {/* Nav Links */}
          <AnimatePresence mode="wait">
            {!isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex gap-2"
              >
                {["Home", "Library", "Settings"].map((item) => (
                  <a
                    key={item}
                    className="hover:bg-white/10 transition-all duration-200 h-10 flex items-center justify-center hover:text-white text-white/80 px-4 rounded-full whitespace-nowrap"
                    href="/"
                  >
                    {item}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Toggle / Input */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={openSearch}
              className={
                "transition-all duration-200 w-10 h-10 flex items-center justify-center hover:text-white text-white/80 rounded-full flex-shrink-0 " +
                (isSearchOpen ? "bg-white/10" : "hover:bg-white/10")
              }
            >
              <SearchIcon className="w-4 h-4 stroke-3" />
            </button>

            <AnimatePresence mode="wait">
              {isSearchOpen && (
                <motion.div
                  className="flex items-center gap-2 flex-1 overflow-hidden"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <input
                    ref={searchInputRef}
                    className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white placeholder-white/50 outline-none transition-all duration-200"
                    type="text"
                    placeholder="Search movies, shows, collections..."
                    value={searchQuery}
                    onInput={(e) =>
                      setSearchQuery((e.target as HTMLInputElement).value)
                    }
                  />
                  {isLoading && (
                    <Loader2Icon className="w-4 h-4 animate-spin text-white/50 mr-2" />
                  )}
                  <motion.button
                    onClick={closeSearch}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200"
                  >
                    <XIcon className="w-4 h-4 stroke-3 text-white/80" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isSearchOpen && searchResults && searchResults.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[70vh] overflow-y-auto"
            >
              {/* Collections */}
              {searchResults.collections &&
                searchResults.collections.length > 0 && (
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-white/50 text-sm font-medium mb-3">
                      Collections
                    </h3>
                    <div className="space-y-2">
                      {searchResults.collections.map((collection) => (
                        <button
                          key={collection.id}
                          onClick={() => {
                            // Navigate to collection page
                            window.location.href = `/collections/${collection.slug}`;
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors w-full text-left"
                        >
                          {collection.posterUrl && (
                            <img
                              src={collection.posterUrl}
                              alt={collection.name}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">
                              {collection.name}
                            </h4>
                            {collection.description && (
                              <p className="text-white/50 text-sm truncate">
                                {collection.description}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Media */}
              {searchResults.media && searchResults.media.length > 0 && (
                <div className="p-4">
                  <h3 className="text-white/50 text-sm font-medium mb-3">
                    Media
                  </h3>
                  <div className="space-y-2">
                    {searchResults.media.map((media) => (
                      <button
                        key={media.id}
                        onClick={() => {
                          closeSearch();
                          onMediaSelect?.(media.id);
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors w-full text-left"
                      >
                        {media.posterUrl && (
                          <img
                            src={media.posterUrl}
                            alt={media.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">
                            {media.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/50 capitalize">
                              {media.type.toLowerCase().replace("_", " ")}
                            </span>
                            {media.releaseDate && (
                              <>
                                <span className="text-white/30">•</span>
                                <span className="text-white/50">
                                  {new Date(media.releaseDate).getFullYear()}
                                </span>
                              </>
                            )}
                            {media.rating && (
                              <>
                                <span className="text-white/30">•</span>
                                <span className="text-white/50">
                                  ⭐ {media.rating.toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {isSearchOpen &&
            searchQuery.trim() &&
            !isLoading &&
            searchResults?.total === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 text-center"
              >
                <p className="text-white/50">
                  No results found for "{searchQuery}"
                </p>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Header;
