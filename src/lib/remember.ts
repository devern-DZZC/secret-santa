import { readJson, safeStorage, type SafeStorage } from "./storage";

const KEY = "ss:remembered";

export interface Remembered {
  id: string;
  pin: string;
}

/**
 * Remembers the one person who unlocked on this device, so they can come back
 * without re-entering their PIN. Their PIN is re-checked on every visit, so
 * nobody else's giftee can be opened this way.
 */
export function rememberUnlock(id: string, pin: string, store: SafeStorage = safeStorage): void {
  store.set(KEY, JSON.stringify({ id, pin }));
}

export function getRemembered(store: SafeStorage = safeStorage): Remembered | null {
  const value = readJson(store, KEY) as Partial<Remembered> | null;
  if (!value || typeof value.id !== "string" || typeof value.pin !== "string") return null;
  return { id: value.id, pin: value.pin };
}

export function forgetUnlock(store: SafeStorage = safeStorage): void {
  store.remove(KEY);
}
