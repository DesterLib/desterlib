import type { ComponentChildren, JSX } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";

type AnimationPreset =
  | "fade"
  | "scale"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "fadeScale";

type AnimatedProps = {
  children: ComponentChildren;
  show: boolean;
  preset?: AnimationPreset;
  duration?: number;
  delay?: number;
  className?: string;
  style?: JSX.CSSProperties;
  onClick?: (e: Event) => void;
  as?: keyof JSX.IntrinsicElements;
};

const presetClasses = {
  fade: {
    base: "transition-opacity",
    enter: "opacity-100",
    exit: "opacity-0",
  },
  scale: {
    base: "transition-transform",
    enter: "scale-100",
    exit: "scale-90",
  },
  slideUp: {
    base: "transition-transform",
    enter: "translate-y-0",
    exit: "translate-y-4",
  },
  slideDown: {
    base: "transition-transform",
    enter: "translate-y-0",
    exit: "-translate-y-4",
  },
  slideLeft: {
    base: "transition-transform",
    enter: "translate-x-0",
    exit: "translate-x-4",
  },
  slideRight: {
    base: "transition-transform",
    enter: "translate-x-0",
    exit: "-translate-x-4",
  },
  fadeScale: {
    base: "transition-all",
    enter: "opacity-100 scale-100",
    exit: "opacity-0 scale-90",
  },
};

/**
 * Animated - Apply enter/exit animations to any element
 *
 * @example
 * <Animated show={isOpen} preset="fadeScale" duration={300}>
 *   <div>Content</div>
 * </Animated>
 */
export function Animated({
  children,
  show,
  preset = "fade",
  duration = 300,
  delay = 0,
  className = "",
  style,
  onClick,
  as = "div",
}: AnimatedProps) {
  // Start with exit state, will animate to enter state if show is true
  const [isVisible, setIsVisible] = useState(false);
  const isMountedRef = useRef(false);
  const preset_classes = presetClasses[preset];

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;

      if (show) {
        // On mount with show=true, animate from exit to enter
        const timer = setTimeout(() => {
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
        }, delay);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Handle subsequent show changes
    if (show) {
      // Enter animation
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }, delay);
      return () => clearTimeout(timer);
    } else {
      // Exit animation - use RAF to ensure smooth transition
      requestAnimationFrame(() => {
        setIsVisible(false);
      });
    }
  }, [show, delay]);

  const Component = as;
  const durationClass = `duration-${duration}`;

  return (
    <Component
      className={`${preset_classes.base} ${durationClass} ease-out ${
        isVisible ? preset_classes.enter : preset_classes.exit
      } ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}

