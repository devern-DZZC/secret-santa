import { describe, expect, it } from "vitest";
import { WE_WISH_YOU, buildLoop, midiToHz, noteToMidi } from "../src/lib/musicScore";

describe("note helpers", () => {
  it("converts note names to MIDI numbers", () => {
    expect(noteToMidi("A4")).toBe(69);
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("F#5")).toBe(78);
    expect(noteToMidi("C6")).toBe(84);
  });

  it("rejects bad note names", () => {
    expect(() => noteToMidi("H2")).toThrow();
    expect(() => noteToMidi("C")).toThrow();
  });

  it("converts MIDI numbers to frequencies", () => {
    expect(midiToHz(69)).toBeCloseTo(440);
    expect(midiToHz(81)).toBeCloseTo(880);
  });
});

describe("We Wish You a Merry Christmas (the background tune)", () => {
  const loop = buildLoop(WE_WISH_YOU);

  it("is a 3/4 waltz: one pickup beat plus 8 bars", () => {
    expect(WE_WISH_YOU.beatsPerBar).toBe(3);
    expect(loop.beats).toBe(1 + 8 * 3);
    expect(loop.seconds).toBeCloseTo((25 * 60) / WE_WISH_YOU.bpm);
  });

  it("has a melody that fills the loop exactly", () => {
    const total = WE_WISH_YOU.melody.reduce((sum, [, beats]) => sum + beats, 0);
    expect(total).toBe(loop.beats);
  });

  it("opens with the familiar tune: D, G G A G F#, E E E", () => {
    const tune = loop.events.filter((e) => e.kind === "melody").slice(0, 9).map((e) => e.midi);
    expect(tune).toEqual(["D5", "G5", "G5", "A5", "G5", "F#5", "E5", "E5", "E5"].map(noteToMidi));
  });

  it("puts a bass note on the first beat of every bar, and sleigh bells on every beat", () => {
    const bass = loop.events.filter((e) => e.kind === "bass");
    expect(bass).toHaveLength(8);
    expect(bass.map((e) => e.beat)).toEqual([1, 4, 7, 10, 13, 16, 19, 22]);
    expect(loop.events.filter((e) => e.kind === "bells")).toHaveLength(24);
  });

  it("keeps every event inside the loop, in time order", () => {
    for (const e of loop.events) {
      expect(e.beat).toBeGreaterThanOrEqual(0);
      expect(e.beat).toBeLessThan(loop.beats);
    }
    const beats = loop.events.map((e) => e.beat);
    expect(beats).toEqual([...beats].sort((a, b) => a - b));
  });
});
