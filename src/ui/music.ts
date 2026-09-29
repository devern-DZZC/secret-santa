/**
 * Background music: "We Wish You a Merry Christmas" on a music box, synthesised live.
 * A small look-ahead scheduler queues notes ~0.4s ahead so playback stays smooth.
 * Starts on the first tap (phones block audio before that), loops, and ducks
 * under the reveal fanfare.
 */
import { WE_WISH_YOU, buildLoop, midiToHz, type ScoreEvent } from "../lib/musicScore";
import { existingMusicBus, musicBus, type Bus } from "./audio";

/** Background music loudness (0 to 1): kept low so it sits under the sound effects. */
export const MUSIC_VOLUME = 0.1;
const VOLUME = MUSIC_VOLUME;
const LOOKAHEAD_S = 0.45;
const TICK_MS = 120;

const loop = buildLoop(WE_WISH_YOU);
const beatSeconds = 60 / WE_WISH_YOU.bpm;

let timer: number | null = null;
let loopStart = 0;
let nextIndex = 0;

function voice(bus: Bus, at: number, freq: number, partials: Array<[number, number, number]>, gain: number, length: number) {
  for (const [ratio, amp, decay] of partials) {
    const osc = bus.ac.createOscillator();
    const g = bus.ac.createGain();
    osc.frequency.setValueAtTime(freq * ratio, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain * amp, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + Math.min(length, 3 / decay));
    osc.connect(g).connect(bus.out);
    osc.start(at);
    osc.stop(at + length + 0.05);
  }
}

// A music-box tine: bright fundamental plus quickly fading upper partials.
const MUSIC_BOX: Array<[number, number, number]> = [
  [1, 1, 2.2],
  [2, 0.22, 4],
  [3.01, 0.08, 7],
];
const BASS: Array<[number, number, number]> = [
  [1, 1, 2.5],
  [2, 0.25, 3],
];
const PLUCK: Array<[number, number, number]> = [[1, 1, 7]];

function playEvent(bus: Bus, e: ScoreEvent, at: number) {
  switch (e.kind) {
    case "melody":
      return voice(bus, at, midiToHz(e.midi), MUSIC_BOX, 0.3, 1.5);
    case "bass":
      return voice(bus, at, midiToHz(e.midi), BASS, 0.22, 0.9);
    case "chord":
      return voice(bus, at, midiToHz(e.midi), PLUCK, 0.06, 0.4);
    default: {
      // a quiet shake of sleigh bells on each beat
      for (let i = 0; i < 3; i++) {
        const t = at + Math.random() * 0.05;
        voice(bus, t, 2400 + Math.random() * 1400, [[1, 1, 32]], 0.018, 0.12);
      }
    }
  }
}

function schedule() {
  const bus = musicBus();
  if (!bus) return stopMusic();
  const horizon = bus.ac.currentTime + LOOKAHEAD_S;
  for (;;) {
    const e = loop.events[nextIndex]!;
    const at = loopStart + e.beat * beatSeconds;
    if (at > horizon) break;
    playEvent(bus, e, at);
    nextIndex++;
    if (nextIndex >= loop.events.length) {
      nextIndex = 0;
      loopStart += loop.seconds;
    }
  }
}

export function isMusicPlaying(): boolean {
  return timer !== null;
}

/** Starts the loop (fading in). Safe to call repeatedly; does nothing if music is off. */
export function startMusic() {
  if (timer !== null) return;
  const bus = musicBus();
  if (!bus) return;
  const now = bus.ac.currentTime;
  bus.out.gain.cancelScheduledValues(now);
  bus.out.gain.setValueAtTime(0.0001, now);
  bus.out.gain.exponentialRampToValueAtTime(VOLUME, now + 2);
  loopStart = now + 0.15;
  nextIndex = 0;
  schedule();
  timer = window.setInterval(schedule, TICK_MS);
}

/** Stops the loop with a short fade. */
export function stopMusic() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  const bus = existingMusicBus();
  if (bus) {
    const now = bus.ac.currentTime;
    bus.out.gain.cancelScheduledValues(now);
    bus.out.gain.setTargetAtTime(0, now, 0.15);
  }
}

/** Turns the music down under the reveal fanfare, then brings it back. */
export function duckMusic(ms: number) {
  if (timer === null) return;
  const bus = musicBus();
  if (!bus) return;
  const now = bus.ac.currentTime;
  bus.out.gain.cancelScheduledValues(now);
  bus.out.gain.setTargetAtTime(VOLUME * 0.2, now, 0.08);
  bus.out.gain.setTargetAtTime(VOLUME, now + ms / 1000, 0.6);
}
