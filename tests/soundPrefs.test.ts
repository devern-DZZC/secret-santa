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
