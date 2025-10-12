import { useEffect } from "preact/hooks";

/**
 * Locks the document body scroll and compensates for the scrollbar width
 * by adding right padding to prevent layout shift while a modal is open.
 */
export function useBodyScrollLock(isLocked: boolean = true): void {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}
