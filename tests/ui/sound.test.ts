import { describe, expect, it, vi } from "vitest";
import { sfx } from "../../src/ui/sound";

describe("sound effects", () => {
  it("never throw when the browser has no Web Audio (jsdom, very old phones)", () => {
    for (const play of [sfx.key, sfx.wrong, sfx.unlock, () => sfx.tap(1), () => sfx.tap(3), sfx.reveal]) {
      expect(() => play()).not.toThrow();
    }
  });
});

describe("with Web Audio available", () => {
  function fakeAudio() {
    const created = { oscillators: 0, contexts: 0 };
    const node = () => ({
      connect: (n: unknown) => n ?? node(),
      gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    });
    class FakeContext {
      currentTime = 0;
      state = "running";
      destination = node();
      constructor() {
        created.contexts++;
      }
      createGain = node;
      createDynamicsCompressor = node;
      createOscillator() {
        created.oscillators++;
        return { ...node(), type: "sine", frequency: { setValueAtTime() {} }, start() {}, stop() {} };
      }
      resume() {
        return Promise.resolve();
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
    return created;
  }

  it("plays bells for every effect, reusing one audio context", async () => {
    vi.resetModules();
    localStorage.clear();
    const created = fakeAudio();
    const { sfx: live } = await import("../../src/ui/sound");
    live.key();
    live.wrong();
    live.unlock();
    live.tap(2);
    live.reveal();
    expect(created.contexts).toBe(1);
    expect(created.oscillators).toBeGreaterThan(40);
  });

  it("stays silent when the person has turned sound off", async () => {
    vi.resetModules();
    localStorage.setItem("ss:sound", "off");
    const created = fakeAudio();
    const { sfx: live } = await import("../../src/ui/sound");
    live.reveal();
    expect(created.contexts).toBe(0);
    localStorage.clear();
  });
});
