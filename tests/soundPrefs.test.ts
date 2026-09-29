import { beforeEach, describe, expect, it } from "vitest";
import { isSoundOn, setSoundOn } from "../src/lib/soundPrefs";
import { createSafeStorage } from "../src/lib/storage";

beforeEach(() => localStorage.clear());

describe("sound preference", () => {
  it("is on by default", () => {
    expect(isSoundOn()).toBe(true);
  });

  it("remembers turning sound off and back on", () => {
    setSoundOn(false);
    expect(isSoundOn()).toBe(false);
    setSoundOn(true);
    expect(isSoundOn()).toBe(true);
  });

  it("stays on when storage is blocked", () => {
    const blocked = createSafeStorage(() => {
      throw new Error("blocked");
    });
    setSoundOn(false, blocked);
    expect(isSoundOn(blocked)).toBe(true);
  });
});

describe("music preference (separate from sound effects)", () => {
  it("is on by default and independent of sound effects", async () => {
    const { isMusicOn, setMusicOn } = await import("../src/lib/soundPrefs");
    expect(isMusicOn()).toBe(true);
    setMusicOn(false);
    expect(isMusicOn()).toBe(false);
    expect(isSoundOn()).toBe(true);
    setMusicOn(true);
    expect(isMusicOn()).toBe(true);
  });
});
