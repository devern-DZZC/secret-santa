import { useEffect, useRef } from "react";

/** Set when the app moves to a new screen, so that screen's heading takes focus. */
export const focusRequest = { pending: false };

/**
 * Returns a ref for a screen's main heading. When the screen appears because
 * the person navigated (not on first page load), focus moves to the heading so
 * keyboard and screen reader users land at the top of the new screen.
 */
export function useScreenHeading<T extends HTMLElement = HTMLHeadingElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!focusRequest.pending) return;
    focusRequest.pending = false;
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}
