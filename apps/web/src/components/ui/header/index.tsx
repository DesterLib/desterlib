import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import NavLink from "./nav-link";
import {
  tabsContainerVariants,
  tabsContainerTransition,
  searchContainerVariants,
  searchContainerTransition,
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
import { useOffline } from "@/hooks/useOffline";
import HeaderOffline from "./header-offline";

const allTabs = [
  { id: "home", label: "Home", href: "/" },
  { id: "library", label: "Library", href: "/library" },
  { id: "settings", label: "Settings", href: "/settings" },
];

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const [hasMounted, setHasMounted] = useState(false);

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

  // Skip initial animations
  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  // Check if we're on the settings page
  const isOnSettingsPage = location.pathname.startsWith("/settings");

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

  // Use offline header when not connected - check after all hooks
  if (!isOnline) {
    return <HeaderOffline />;
  }

  return (
    <div className="w-full fixed top-0 left-0 right-0 z-50">
      <nav className="w-fit mx-auto space-y-4 p-4">
        <motion.div
          layout="position"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.2,
            layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          }}
          className="w-full flex justify-center items-center"
        >
          <motion.div
            layout="position"
            transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
          >
            <motion.button
              onClick={() => setIsDialogOpen(true)}
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{
                backdropFilter: "blur(10px)",
                transition: { delay: 0.2 },
              }}
              exit={{ backdropFilter: "blur(0px)" }}
              className="border h-12 w-12 bg-neutral-900/60 border-white/10 rounded-[50px] flex items-center justify-center"
            >
              <Logo className="w-8 h-8" />
            </motion.button>
          </motion.div>
          <AnimatePresence>
            {!isSearchOpen && (
              <motion.div
                key="tabs"
                layout
                initial={hasMounted ? "initial" : false}
                animate="animate"
                exit="exit"
                variants={tabsContainerVariants}
                transition={tabsContainerTransition}
                style={{ overflow: "hidden" }}
              >
                <motion.div
                  initial={{ backdropFilter: "blur(0px)" }}
                  animate={{ backdropFilter: "blur(10px)" }}
                  exit={{ backdropFilter: "blur(0px)" }}
                  transition={{ delay: 0.2 }}
                  className="flex ml-2 space-x-1 w-fit bg-neutral-900/60 p-1 rounded-[50px] border border-white/10"
                >
                  {tabs.map((tab) => (
                    <NavLink
                      key={tab.id}
                      tab={tab}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      showBubble={isOnHeaderTab}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isOnSettingsPage && (
              <motion.div
                key="search"
                layout
                initial={hasMounted ? "initial" : false}
                animate="animate"
                exit="exit"
                variants={searchContainerVariants}
                transition={searchContainerTransition}
                style={{ transformOrigin: "left center" }}
                className="border bg-neutral-900/60 !backdrop-blur-lg border-white/10 rounded-[50px] flex items-center ml-2"
              >
                <div className="p-1">
                  <motion.button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    animate={searchButtonMotion.animate(isSearchOpen)}
                    transition={searchButtonMotion.transition}
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
            )}
          </AnimatePresence>
          <motion.div
            layout
            transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
          >
            <UserMenu />
          </motion.div>
        </motion.div>
        <AnimatePresence>
          {isSearchOpen && !isOnSettingsPage && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={filtersContainerVariants}
              transition={filtersContainerTransition}
              className="w-full"
            >
              <div className="relative pl-14">
                <div className="flex items-center w-full gap-2">
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
                    onClose={handleCloseSearch}
                  />
                )}
              </div>
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
