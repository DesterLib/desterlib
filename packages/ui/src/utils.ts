// Utility to merge class names
export const cn = (...classes: (string | undefined)[]): string => {
  return classes.filter((cls): cls is string => Boolean(cls)).join(" ");
};
