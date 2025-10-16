export const tabsContainerVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

export const tabsContainerTransition = {
  duration: 0.3,
  ease: "easeInOut" as const,
};

export const searchContainerMotion = {
  initial: { marginLeft: 8, backdropFilter: "blur(0px)" },
  animate: (isSearchOpen: boolean) => ({
    marginLeft: isSearchOpen ? 0 : 8,
    backdropFilter: isSearchOpen ? "blur(10px)" : "blur(0px)",
  }),
};

export const searchButtonMotion = {
  animate: (isSearchOpen: boolean) => ({
    borderTopRightRadius: isSearchOpen ? 12 : 50,
    borderBottomRightRadius: isSearchOpen ? 12 : 50,
  }),
};

export const searchInputVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 500, opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

export const searchInputTransition = {
  duration: 0.3,
  ease: "easeInOut" as const,
};

export const filtersContainerVariants = {
  hidden: {},
  visible: {},
};

export const filtersContainerTransition = {
  duration: 0.2,
  ease: "easeInOut" as const,
  staggerChildren: 0.05,
};

export const filterButtonVariants = {
  hidden: { opacity: 0, scale: 0.9, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, scale: 1, backdropFilter: "blur(10px)" },
};
