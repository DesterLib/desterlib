import type { RefObject } from "preact";
import { useEffect, useLayoutEffect, useState } from "preact/hooks";

/**
 * Measures the scrollHeight of a referenced element and keeps it in sync
 * with content changes using ResizeObserver and rAF coalescing.
 */
export function useMeasuredHeight(
  ref: RefObject<HTMLElement | null>,
  deps: any[] = []
): number {
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);

  // Initial measurement and whenever deps change
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setMeasuredHeight(element.scrollHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Keep height updated as content resizes
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let rafId: number | null = null;
    const updateHeight = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const next = element.scrollHeight;
        setMeasuredHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
      });
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);
    updateHeight();

    return () => {
      resizeObserver.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [ref]);

  return measuredHeight;
}
