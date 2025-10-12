import type { ComponentChildren } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

type AnimatedPresenceProps = {
  children: ComponentChildren;
  show: boolean;
  exitDuration?: number;
};

/**
 * AnimatedPresence - Manages mount/unmount animations
 * Delays unmounting to allow exit animations to complete
 */
export function AnimatedPresence({
  children,
  show,
  exitDuration = 300,
}: AnimatedPresenceProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const timeoutRef = useRef<number>();

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow exit animation
      timeoutRef.current = window.setTimeout(() => {
        setShouldRender(false);
      }, exitDuration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, exitDuration]);

  if (!shouldRender) return null;

  return <>{children}</>;
}
