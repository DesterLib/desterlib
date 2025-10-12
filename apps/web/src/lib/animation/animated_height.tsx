import type { ComponentChildren, JSX } from "preact";
import { useRef, useEffect, useState } from "preact/hooks";

type AnimatedHeightProps = {
  height: number;
  className?: string;
  style?: JSX.CSSProperties;
  children?: ComponentChildren;
};

export function AnimatedHeight({
  height,
  className,
  style,
  children,
}: AnimatedHeightProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Enable transitions only after initial mount and paint
    if (!isMountedRef.current && height > 0) {
      isMountedRef.current = true;
      // Wait enough time for the browser to paint the initial state
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [height]);

  return (
    <div
      className={`${className || ""} ${shouldAnimate ? "transition-[height] duration-300 ease-out" : ""}`}
      style={{
        height,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
