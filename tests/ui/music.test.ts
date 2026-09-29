import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeAudio, removeFakeAudio } from "./fakeAudio";

let stats: ReturnType<typeof installFakeAudio>;
let music: typeof import("../../src/ui/music");

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  localStorage.clear();
  stats = installFakeAudio();
  music = await import("../../src/ui/music");
});

afterEach(() => {
  music.stopMusic();
  vi.useRealTimers();
  removeFakeAudio();
  localStorage.clear();
});

describe("background music", () => {
  it("starts playing notes and keeps scheduling ahead", () => {
    music.startMusic();
    expect(music.isMusicPlaying()).toBe(true);
    const first = stats.oscillators;
    expect(first).toBeGreaterThan(0);
    stats.ctx!.currentTime = 3;
    vi.advanceTimersByTime(200);
    expect(stats.oscillators).toBeGreaterThan(first);
  });

  it("loops the tune without stopping", () => {
    music.startMusic();
    const loopSeconds = (25 * 60) / 165;
    for (let t = 0; t < loopSeconds * 2.5; t += 0.1) {
      stats.ctx!.currentTime = t;
      vi.advanceTimersByTime(120);
    }
    const afterTwoLoops = stats.oscillators;
    stats.ctx!.currentTime += 2;
    vi.advanceTimersByTime(240);
    expect(stats.oscillators).toBeGreaterThan(afterTwoLoops);
  });

  it("only starts once, however many times it's asked", () => {
    music.startMusic();
    music.startMusic();
    expect(stats.contexts).toBe(1);
  });

  it("stops scheduling notes when stopped", () => {
    music.startMusic();
    music.stopMusic();
    expect(music.isMusicPlaying()).toBe(false);
    const count = stats.oscillators;
    stats.ctx!.currentTime = 10;
    vi.advanceTimersByTime(1000);
    expect(stats.oscillators).toBe(count);
    music.stopMusic(); // stopping twice is harmless
  });

  it("stays silent when music is turned off", () => {
    localStorage.setItem("ss:music", "off");
    music.startMusic();
    expect(music.isMusicPlaying()).toBe(false);
    expect(stats.contexts).toBe(0);
  });

  it("stops by itself if music is switched off while playing", () => {
    music.startMusic();
    localStorage.setItem("ss:music", "off");
    vi.advanceTimersByTime(200);
    expect(music.isMusicPlaying()).toBe(false);
  });

  it("ducks under the reveal fanfare and comes back", () => {
    music.duckMusic(1000); // not playing yet: nothing to duck
    expect(stats.gainMoves).toBe(0);
    music.startMusic();
    music.duckMusic(1000);
    expect(stats.gainMoves).toBe(2);
  });
});
