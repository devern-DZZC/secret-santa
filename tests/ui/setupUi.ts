/**
 * Shared setup for UI tests.
 * - The real draw is NEVER rendered in UI tests: drawStore is replaced by the public fixture.
 * - Reduced motion is on by default so tests are fast and deterministic.
 */
import { vi } from "vitest";
import { FIXTURE_DRAW } from "../helpers/fixtureDraw";

vi.mock("../../src/lib/drawStore", () => ({
  getReceiverId: (id: string) => FIXTURE_DRAW[id],
}));

export function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion") && !query.includes("no-preference"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

setReducedMotion(true);
window.scrollTo = () => {};
