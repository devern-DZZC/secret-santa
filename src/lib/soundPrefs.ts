import { safeStorage, type SafeStorage } from "./storage";

const SOUND_KEY = "ss:sound";
const MUSIC_KEY = "ss:music";

/** Sound effects are on unless the person has turned them off on this device. */
export function isSoundOn(store: SafeStorage = safeStorage): boolean {
  return store.get(SOUND_KEY) !== "off";
}

export function setSoundOn(on: boolean, store: SafeStorage = safeStorage): void {
  store.set(SOUND_KEY, on ? "on" : "off");
}

/** Background music is on unless the person has turned it off on this device. */
export function isMusicOn(store: SafeStorage = safeStorage): boolean {
  return store.get(MUSIC_KEY) !== "off";
}

export function setMusicOn(on: boolean, store: SafeStorage = safeStorage): void {
  store.set(MUSIC_KEY, on ? "on" : "off");
}
