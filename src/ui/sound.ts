/**
 * Christmas sound effects, synthesised with the Web Audio API (no audio files to download).
 * Bells use a few inharmonic partials so they ring like real handbells; sleigh bells are
 * clusters of tiny high bells. Everything is a no-op when sound is off or unsupported.
 */
import { isSoundOn } from "../lib/soundPrefs";

type Ctx = AudioContext;
let ctx: Ctx | null = null;
let master: GainNode | null = null;

function audio(): { ac: Ctx; out: AudioNode } | null {
  if (!isSoundOn()) return null;
  const AC =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    if (!ctx) {
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return { ac: ctx, out: master! };
  } catch {
    return null;
  }
}

function tone(
  a: { ac: Ctx; out: AudioNode },
  at: number,
  freq: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
) {
  const osc = a.ac.createOscillator();
  const g = a.ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(a.out);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

/** A handbell: fundamental plus inharmonic partials that die away faster. */
function bell(a: { ac: Ctx; out: AudioNode }, at: number, freq: number, gain = 0.22, dur = 1.4) {
  const partials: Array<[ratio: number, amp: number]> = [
    [1, 1],
    [2.01, 0.45],
    [2.76, 0.3],
    [5.4, 0.12],
  ];
  partials.forEach(([ratio, amp], i) => tone(a, at, freq * ratio, dur / (1 + i * 0.7), gain * amp));
}

/** A shake of sleigh bells: many tiny, slightly random high bells. */
function sleighBells(a: { ac: Ctx; out: AudioNode }, at: number, count: number, spread: number, gain = 0.07) {
  for (let i = 0; i < count; i++) {
    const t = at + Math.random() * spread;
    const f = 2600 + Math.random() * 1900;
    tone(a, t, f, 0.12 + Math.random() * 0.18, gain);
    tone(a, t, f * 1.51, 0.08, gain * 0.5);
  }
}

const play = (fn: (a: { ac: Ctx; out: AudioNode }, now: number) => void) => () => {
  const a = audio();
  if (a) fn(a, a.ac.currentTime + 0.01);
};

export const sfx = {
  /** Soft wooden tick for keypad presses. */
  key: play((a, t) => tone(a, t, 1250, 0.05, 0.08, "triangle")),
  /** Two falling notes: not quite. */
  wrong: play((a, t) => {
    tone(a, t, 392, 0.16, 0.12, "triangle");
    tone(a, t + 0.14, 294, 0.26, 0.12, "triangle");
  }),
  /** Ding-ding: the PIN worked. */
  unlock: play((a, t) => {
    bell(a, t, 1318.5, 0.16, 0.9);
    bell(a, t + 0.12, 1760, 0.16, 1.1);
  }),
  /** Jingle for each tap on the gift, getting bigger with every tap. */
  tap: (n: number) =>
    play((a, t) => {
      sleighBells(a, t, 5 + n * 4, 0.12 + n * 0.06, 0.05 + n * 0.015);
    })(),
  /** The big moment: sleigh-bell shimmer plus a rising bell arpeggio. */
  reveal: play((a, t) => {
    sleighBells(a, t, 26, 0.9, 0.06);
    [1046.5, 1318.5, 1568, 2093, 2637].forEach((f, i) => bell(a, t + 0.08 + i * 0.13, f, 0.2, 1.8));
  }),
};
