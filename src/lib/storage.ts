/** localStorage that never throws (private browsing and blocked storage just don't persist). */
export interface SafeStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function createSafeStorage(backend: () => Storage): SafeStorage {
  return {
    get(key) {
      try {
        return backend().getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        backend().setItem(key, value);
      } catch {
        /* storage unavailable: carry on without persisting */
      }
    },
    remove(key) {
      try {
        backend().removeItem(key);
      } catch {
        /* storage unavailable */
      }
    },
  };
}

export const safeStorage = createSafeStorage(() => window.localStorage);

/** Parses JSON, returning null instead of throwing. */
export function readJson(store: SafeStorage, key: string): unknown {
  const raw = store.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
