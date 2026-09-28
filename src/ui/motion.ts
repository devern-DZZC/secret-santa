import { useReducedMotion } from "motion/react";

/** True when the person has asked their device for less motion. */
export function useCalmMode(): boolean {
  return useReducedMotion() ?? false;
}

/** The app's one easing curve: quick out, soft landing. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const screenTransition = (calm: boolean) =>
  calm
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.45, ease: EASE_OUT },
      };
