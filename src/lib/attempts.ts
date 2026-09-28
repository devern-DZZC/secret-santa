import { readJson, safeStorage, type SafeStorage } from "./storage";

export const MAX_FAILURES = 5;
export const LOCK_MS = 30_000;
const KEY = "ss:attempts";

interface Entry {
  fails: number;
  lockedUntil: number;
}

export interface AttemptTracker {
  isLocked(id: string): boolean;
  lockRemainingMs(id: string): number;
  failuresLeft(id: string): number;
  recordFailure(id: string): void;
  recordSuccess(id: string): void;
}

const isEntry = (v: unknown): v is Entry =>
  !!v &&
  typeof v === "object" &&
  Number.isFinite((v as Entry).fails) &&
  Number.isFinite((v as Entry).lockedUntil);

/** Keeps only well-formed saved entries; anything else starts fresh. */
function loadState(saved: unknown): Record<string, Entry> {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  return Object.fromEntries(Object.entries(saved).filter(([, v]) => isEntry(v))) as Record<string, Entry>;
}

export function createAttemptTracker({
  now = Date.now,
  store = safeStorage,
}: { now?: () => number; store?: SafeStorage } = {}): AttemptTracker {
  const state = loadState(readJson(store, KEY));

  const save = () => store.set(KEY, JSON.stringify(state));
  const entry = (id: string): Entry => (state[id] ??= { fails: 0, lockedUntil: 0 });

  // Capped so a changed phone clock can never lock someone out for longer than LOCK_MS.
  const lockRemainingMs = (id: string) => Math.min(LOCK_MS, Math.max(0, entry(id).lockedUntil - now()));

  const clearExpired = (id: string) => {
    const e = entry(id);
    if (e.lockedUntil !== 0 && lockRemainingMs(id) === 0) {
      e.fails = 0;
      e.lockedUntil = 0;
    }
  };

  return {
    lockRemainingMs,
    isLocked: (id) => lockRemainingMs(id) > 0,
    failuresLeft(id) {
      clearExpired(id);
      return MAX_FAILURES - entry(id).fails;
    },
    recordFailure(id) {
      if (lockRemainingMs(id) > 0) return;
      clearExpired(id);
      const e = entry(id);
      e.fails++;
      if (e.fails >= MAX_FAILURES) e.lockedUntil = now() + LOCK_MS;
      save();
    },
    recordSuccess(id) {
      delete state[id];
      save();
    },
  };
}
