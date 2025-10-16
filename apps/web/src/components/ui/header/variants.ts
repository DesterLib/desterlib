export const tabsContainerVariants = {
  initial: { width: 0, opacity: 0, x: 0 },
  animate: { width: "auto", opacity: 1, x: 0 },
  exit: { width: 0, opacity: 0, x: 0 },
};

export const tabsContainerTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
  layout: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
  },
};

export const searchContainerVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

export const searchContainerTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const, // Custom easing for smoother feel
  layout: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
  },
};

export const searchButtonMotion = {
  animate: (isSearchOpen: boolean) => ({
    borderTopRightRadius: isSearchOpen ? 12 : 50,
    borderBottomRightRadius: isSearchOpen ? 12 : 50,
  }),
  transition: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
  },
};

export const searchInputVariants = {
  initial: { width: 0, opacity: 0, scale: 0.95 },
  animate: { width: 500, opacity: 1, scale: 1 },
  exit: { width: 0, opacity: 0, scale: 0.95 },
};

export const searchInputTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
};

export const filtersContainerVariants = {
  hidden: {},
  visible: {},
};

export const filtersContainerTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
  staggerChildren: 0.05,
};

export const filterButtonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};
