import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import NavLink from "./nav-link";
import {
  tabsContainerVariants,
  tabsContainerTransition,
  searchContainerMotion,
  searchButtonMotion,
  searchInputVariants,
  searchInputTransition,
  filtersContainerVariants,
  filtersContainerTransition,
  filterButtonVariants,
} from "./variants";
import Logo from "../logo";
import ModeDialog from "../mode-dialog";
import UserMenu from "./user-menu";
import { useSearch } from "@/lib/hooks";
import type { GetApiV1SearchParams } from "@dester/api-client";
import SearchResults from "./search-results";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

const allTabs = [
  { id: "home", label: "Home", href: "/" },
  { id: "library", label: "Library", href: "/library" },
  { id: "settings", label: "Settings", href: "/settings" },
];

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Filter tabs based on user role - hide Settings for guests and unauthenticated users
  const tabs = useMemo(() => {
    if (!user || user.role === "GUEST") {
      return allTabs.filter((tab) => tab.id !== "settings");
    }
    return allTabs;
  }, [user]);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<
    "all" | "movies" | "tvshows"
  >("all");

  // Sync activeTab with current route
  useEffect(() => {
    const currentTab = tabs.find((tab) => {
      // Exact match for home, startsWith for others to handle nested routes
      if (tab.href === "/") {
        return location.pathname === "/";
      }
      return location.pathname.startsWith(tab.href);
    });
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [location.pathname, tabs]);

  // Check if current path matches any of the header tabs
  const isOnHeaderTab = tabs.some((tab) => {
    // Exact match for home, startsWith for others to handle nested routes
    if (tab.href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(tab.href);
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Prepare search filters - always search media when filtering by movies/tvshows
  const searchFilters: GetApiV1SearchParams = {
    q: debouncedQuery,
    ...(searchFilter !== "all" && { type: "media" }),
  };

  // Execute search
  const { data: searchResults, isLoading } = useSearch(
    searchFilters,
    isSearchOpen && debouncedQuery.length > 0
  );

  // Reset search when closing
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className="w-full fixed top-0 left-0 right-0 z-50">
      <nav className="w-fit mx-auto space-y-4 p-4">
        <div className="w-full flex justify-center items-center">
          <motion.button
            onClick={() => setIsDialogOpen(true)}
            className="border mr-2 h-12 w-12 bg-neutral-900/60 backdrop-blur-lg border-white/10 rounded-[50px] flex items-center justify-center [will-change:backdrop-filter]"
          >
            <Logo className="w-8 h-8" />
          </motion.button>
          <AnimatePresence>
            {!isSearchOpen && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={tabsContainerVariants}
                transition={tabsContainerTransition}
              >
                <div className="flex space-x-1 w-fit bg-neutral-900/60 backdrop-blur-lg p-1 rounded-[50px] border border-white/10 [will-change:backdrop-filter]">
                  {tabs.map((tab) => (
                    <NavLink
                      key={tab.id}
                      tab={tab}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      showBubble={isOnHeaderTab}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial={searchContainerMotion.initial}
            animate={searchContainerMotion.animate(isSearchOpen)}
            className="border bg-neutral-900/60 backdrop-blur-lg border-white/10 rounded-[50px] flex items-center [will-change:backdrop-filter]"
          >
            <div className="p-1">
              <motion.button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                animate={searchButtonMotion.animate(isSearchOpen)}
                className={cn(
                  "w-10 h-10 transition-colors duration-300 flex items-center justify-center  rounded-[50px]",
                  isSearchOpen ? "bg-white/10" : "hover:bg-white/10"
                )}
              >
                <SearchIcon className="w-4 h-4" />
              </motion.button>
            </div>
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={searchInputVariants}
                  transition={searchInputTransition}
                  className="overflow-hidden"
                >
                  <div className="flex items-center p-1 w-full">
                    <input
                      type="text"
                      className="flex-1 h-10 outline-none bg-transparent text-white"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={handleCloseSearch}
                      className="w-10 h-10 transition-colors duration-300 flex items-center justify-center hover:bg-neutral-800/60 rounded-[50px]"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <UserMenu />
        </div>
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={filtersContainerVariants}
              transition={filtersContainerTransition}
              className="w-full"
            >
              <div className="flex items-center w-full gap-2 pl-14">
                <motion.div variants={filterButtonVariants}>
                  <Button
                    onClick={() => setSearchFilter("all")}
                    variant={searchFilter === "all" ? "default" : "ghost"}
                  >
                    All
                  </Button>
                </motion.div>
                <motion.div variants={filterButtonVariants}>
                  <Button
                    onClick={() => setSearchFilter("movies")}
                    variant={searchFilter === "movies" ? "default" : "ghost"}
                  >
                    Movies
                  </Button>
                </motion.div>
                <motion.div variants={filterButtonVariants}>
                  <Button
                    onClick={() => setSearchFilter("tvshows")}
                    variant={searchFilter === "tvshows" ? "default" : "ghost"}
                  >
                    TV Shows
                  </Button>
                </motion.div>
              </div>
              {isSearchOpen && debouncedQuery && (
                <SearchResults
                  results={searchResults}
                  isLoading={isLoading}
                  query={debouncedQuery}
                  filter={searchFilter}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <ModeDialog
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
        />
      </nav>
    </div>
  );
};

export default Header;
