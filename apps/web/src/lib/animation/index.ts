/**
 * Simple Animation Library
 * Built on Tailwind CSS and CSS transitions
 *
 * @example Basic usage with Animated component:
 * ```tsx
 * <Animated show={isOpen} preset="fadeScale" duration={300}>
 *   <div>Content</div>
 * </Animated>
 * ```
 *
 * @example With AnimatedPresence for mount/unmount:
 * ```tsx
 * <AnimatedPresence show={isOpen} exitDuration={300}>
 *   <Animated show={isOpen} preset="fadeScale">
 *     <div>Content</div>
 *   </Animated>
 * </AnimatedPresence>
 * ```
 *
 * @example Using hooks for custom animations:
 * ```tsx
 * const { isVisible } = useAnimation({ show: isOpen });
 *
 * return (
 *   <div className={`transition-all ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
 *     Content
 *   </div>
 * );
 * ```
 */

export { Animated } from "./animated";
export { AnimatedPresence } from "./animated_presence";
export { AnimatedHeight } from "./animated_height";
export { useAnimation, useDelayedUnmount } from "./use_animation";
export {
  transitions,
  states,
  animations,
  buildTransition,
} from "./transitions";
