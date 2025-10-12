import { useState, useEffect } from "preact/hooks";

type UseAnimationOptions = {
  show: boolean;
  delay?: number;
  onEnter?: () => void;
  onExit?: () => void;
};

/**
 * useAnimation Hook
 * Manages animation state with optional callbacks
 *
 * @example
 * const { isVisible, shouldRender } = useAnimation({ show: isOpen });
 *
 * return shouldRender ? (
 *   <div className={isVisible ? 'opacity-100' : 'opacity-0'}>
 *     Content
 *   </div>
 * ) : null;
 */
export function useAnimation({
  show,
  delay = 0,
  onEnter,
  onExit,
}: UseAnimationOptions) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
          onEnter?.();
        });
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      onExit?.();
    }
  }, [show, delay, onEnter, onExit]);

  return {
    isVisible,
    shouldRender: show || isVisible, // Keep rendered during exit animation
  };
}

/**
 * useDelayedUnmount Hook
 * Delays unmounting to allow exit animations
 *
 * @example
 * const shouldRender = useDelayedUnmount(isOpen, 300);
 *
 * return shouldRender ? <div>Content</div> : null;
 */
export function useDelayedUnmount(show: boolean, delayMs: number = 300) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, delayMs);
      return () => clearTimeout(timer);
    }
  }, [show, delayMs]);

  return shouldRender;
}
