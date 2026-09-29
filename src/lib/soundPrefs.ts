import { safeStorage, type SafeStorage } from "./storage";

const KEY = "ss:sound";

/** Sound is on unless the person has turned it off on this device. */
export function isSoundOn(store: SafeStorage = safeStorage): boolean {
  return store.get(KEY) !== "off";
}

export function setSoundOn(on: boolean, store: SafeStorage = safeStorage): void {
  store.set(KEY, on ? "on" : "off");
}
