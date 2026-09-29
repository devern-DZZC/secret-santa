/**
 * The background tune as data: "We Wish You a Merry Christmas" (traditional,
 * public domain), arranged for music box with a light waltz accompaniment.
 */

export type NoteName = string; // e.g. "C5", "F#4"

export interface Score {
  bpm: number;
  beatsPerBar: number;
  /** Beats before the first full bar (the "We" before "wish"). */
  pickup: number;
  melody: ReadonlyArray<readonly [note: NoteName, beats: number]>;
  /** One chord per full bar: [bass root, chord tone, chord tone]. */
  chords: ReadonlyArray<readonly [NoteName, NoteName, NoteName]>;
}

export interface ScoreEvent {
  beat: number;
  midi: number;
  kind: "melody" | "bass" | "chord" | "bells";
}

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteToMidi(name: NoteName): number {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) throw new Error(`Not a note: ${name}`);
  return 12 * (Number(m[3]) + 1) + SEMITONE[m[1]!]! + (m[2] ? 1 : 0);
}

export const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const G: readonly [string, string, string] = ["G2", "B3", "D4"];
const C: readonly [string, string, string] = ["C3", "E4", "G4"];
const A: readonly [string, string, string] = ["A2", "C#4", "E4"];
const D: readonly [string, string, string] = ["D3", "F#4", "A4"];
const B: readonly [string, string, string] = ["B2", "D#4", "F#4"];

export const WE_WISH_YOU: Score = {
  bpm: 165,
  beatsPerBar: 3,
  pickup: 1,
  melody: [
    ["D5", 1],
    ["G5", 1], ["G5", 0.5], ["A5", 0.5], ["G5", 0.5], ["F#5", 0.5],
    ["E5", 1], ["E5", 1], ["E5", 1],
    ["A5", 1], ["A5", 0.5], ["B5", 0.5], ["A5", 0.5], ["G5", 0.5],
    ["F#5", 1], ["D5", 1], ["D5", 1],
    ["B5", 1], ["B5", 0.5], ["C6", 0.5], ["B5", 0.5], ["A5", 0.5],
    ["G5", 1], ["E5", 1], ["D5", 0.5], ["D5", 0.5],
    ["E5", 1], ["A5", 1], ["F#5", 1],
    ["G5", 3], // held a beat longer: a breath before the loop repeats (as in the preview)
  ],
  chords: [G, C, A, D, B, C, D, G],
};

/** Flattens a score into timed events for one loop. */
export function buildLoop(score: Score): { beats: number; seconds: number; events: ScoreEvent[] } {
  const beats = score.pickup + score.chords.length * score.beatsPerBar;
  const events: ScoreEvent[] = [];

  let beat = 0;
  for (const [note, length] of score.melody) {
    events.push({ beat, midi: noteToMidi(note), kind: "melody" });
    beat += length;
  }

  score.chords.forEach(([root, ...tones], bar) => {
    const start = score.pickup + bar * score.beatsPerBar;
    events.push({ beat: start, midi: noteToMidi(root), kind: "bass" });
    for (let k = 0; k < score.beatsPerBar; k++) {
      events.push({ beat: start + k, midi: 0, kind: "bells" });
      if (k > 0) for (const t of tones) events.push({ beat: start + k, midi: noteToMidi(t), kind: "chord" });
    }
  });

  events.sort((a, b) => a.beat - b.beat);
  return { beats, seconds: (beats * 60) / score.bpm, events };
}
