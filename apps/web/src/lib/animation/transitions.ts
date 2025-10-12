/**
 * Transition Utilities
 * Pre-defined transition classes for common animations
 */

export const transitions = {
  // Fade transitions
  fade: "transition-opacity duration-300 ease-out",
  fadeFast: "transition-opacity duration-150 ease-out",
  fadeSlow: "transition-opacity duration-500 ease-out",

  // Transform transitions
  transform: "transition-transform duration-300 ease-out",
  transformFast: "transition-transform duration-150 ease-out",
  transformSlow: "transition-transform duration-500 ease-out",

  // Combined transitions
  all: "transition-all duration-300 ease-out",
  allFast: "transition-all duration-150 ease-out",
  allSlow: "transition-all duration-500 ease-out",

  // Color transitions
  colors: "transition-colors duration-200 ease-out",

  // Specific property transitions
  height: "transition-[height] duration-300 ease-out",
  width: "transition-[width] duration-300 ease-out",
  spacing: "transition-[margin,padding] duration-300 ease-out",
} as const;

/**
 * Animation state classes
 * Use these to define enter/exit states
 */
export const states = {
  // Opacity states
  visible: "opacity-100",
  hidden: "opacity-0",

  // Scale states
  scaleNormal: "scale-100",
  scaleDown: "scale-90",
  scaleUp: "scale-110",
  scaleZero: "scale-0",

  // Translate states
  translateNone: "translate-x-0 translate-y-0",
  translateUp: "-translate-y-4",
  translateDown: "translate-y-4",
  translateLeft: "-translate-x-4",
  translateRight: "translate-x-4",

  // Rotate states
  rotateNone: "rotate-0",
  rotate90: "rotate-90",
  rotate180: "rotate-180",
  rotate270: "rotate-270",
} as const;

/**
 * Preset animations
 * Complete animation configurations
 */
export const animations = {
  fadeIn: `${transitions.fade} ${states.visible}`,
  fadeOut: `${transitions.fade} ${states.hidden}`,

  slideInUp: `${transitions.transform} ${states.translateNone}`,
  slideOutDown: `${transitions.transform} ${states.translateDown}`,

  scaleIn: `${transitions.transform} ${states.scaleNormal}`,
  scaleOut: `${transitions.transform} ${states.scaleDown}`,

  fadeScaleIn: `${transitions.all} ${states.visible} ${states.scaleNormal}`,
  fadeScaleOut: `${transitions.all} ${states.hidden} ${states.scaleDown}`,
} as const;

/**
 * Helper function to build transition classes
 */
export function buildTransition(
  property: keyof typeof transitions,
  enterState: string,
  exitState: string,
  isEntering: boolean
): string {
  return `${transitions[property]} ${isEntering ? enterState : exitState}`;
}
