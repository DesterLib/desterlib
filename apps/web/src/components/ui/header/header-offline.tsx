import { motion } from "motion/react";
import { useState, useEffect } from "react";
import NavLink from "./nav-link";
import Logo from "../logo";
import UserMenu from "./user-menu";
import { useLocation } from "@tanstack/react-router";
import { tabsContainerVariants, tabsContainerTransition } from "./variants";

// Offline mode tabs for different media types
const offlineTabs = [
  { id: "watch", label: "Watch", href: "/" },
  { id: "listen", label: "Listen", href: "/listen" },
  { id: "read", label: "Read", href: "/read" },
];

/**
 * Offline version of Header with limited functionality
 * No mode switching dialog - just media type tabs
 */
const HeaderOffline = () => {
  const location = useLocation();
  const [hasMounted, setHasMounted] = useState(false);

  // Use offline-specific tabs
  const tabs = offlineTabs;
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Skip initial animations
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Sync activeTab with current route
  useEffect(() => {
    const currentTab = tabs.find((tab) => {
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
    if (tab.href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(tab.href);
  });

  return (
    <div className="hidden md:block w-full fixed top-0 left-0 right-0 z-50">
      <nav className="w-fit mx-auto space-y-4 p-4">
        <motion.div
          layout="preserve-aspect"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.2,
            layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          }}
          className="w-full flex justify-center items-center"
        >
          {/* Logo - no dialog in offline mode */}
          <motion.div
            layout="position"
            transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
          >
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{
                backdropFilter: "blur(10px)",
                transition: { delay: 0.2 },
              }}
              exit={{ backdropFilter: "blur(0px)" }}
              className="border h-12 w-12 bg-neutral-900/60 border-white/10 rounded-[50px] flex items-center justify-center"
            >
              <Logo className="w-8 h-8" />
            </motion.div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            layout="position"
            initial={hasMounted ? "initial" : false}
            animate="animate"
            exit="exit"
            variants={tabsContainerVariants}
            transition={tabsContainerTransition}
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

          {/* User Menu */}
          <motion.div
            layout="position"
            transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
          >
            <UserMenu />
          </motion.div>
        </motion.div>
      </nav>
    </div>
  );
};

export default HeaderOffline;
