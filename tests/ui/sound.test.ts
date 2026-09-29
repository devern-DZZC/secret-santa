import { afterEach, describe, expect, it, vi } from "vitest";
import { installFakeAudio, removeFakeAudio } from "./fakeAudio";

afterEach(() => {
  removeFakeAudio();
  localStorage.clear();
});

describe("sound effects", () => {
  it("never throw when the browser has no Web Audio (jsdom, very old phones)", async () => {
    vi.resetModules();
    const { sfx } = await import("../../src/ui/sound");
    for (const play of [sfx.key, sfx.wrong, sfx.unlock, () => sfx.tap(1), () => sfx.tap(3), sfx.reveal]) {
      expect(() => play()).not.toThrow();
    }
  });

  it("play bells for every effect, reusing one audio context", async () => {
    vi.resetModules();
    const stats = installFakeAudio();
    const { sfx } = await import("../../src/ui/sound");
    sfx.key();
    sfx.wrong();
    sfx.unlock();
    sfx.tap(2);
    sfx.reveal();
    expect(stats.contexts).toBe(1);
    expect(stats.oscillators).toBeGreaterThan(40);
  });

  it("stay silent when sound effects are turned off", async () => {
    vi.resetModules();
    localStorage.setItem("ss:sound", "off");
    const stats = installFakeAudio();
    const { sfx } = await import("../../src/ui/sound");
    sfx.reveal();
    expect(stats.contexts).toBe(0);
  });
});
