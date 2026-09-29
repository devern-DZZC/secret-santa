/**
 * One shared Web Audio graph for the whole app:
 *   sound effects ─┐
 *                  ├─> compressor ─> speakers
 *   music ─────────┘
 * Created lazily inside a tap, because phones only allow audio after a user gesture.
 */
import { isMusicOn, isSoundOn } from "../lib/soundPrefs";

export interface Bus {
  ac: AudioContext;
  out: GainNode;
}

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;

function context(): AudioContext | null {
  const AC =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    if (!ctx) {
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.55;
      sfxGain.connect(comp);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(comp);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** The sound-effects bus, or null when effects are off or audio is unsupported. */
export function sfxBus(): Bus | null {
  if (!isSoundOn()) return null;
  const ac = context();
  return ac ? { ac, out: sfxGain! } : null;
}

/** The music bus, or null when music is off or audio is unsupported. */
export function musicBus(): Bus | null {
  if (!isMusicOn()) return null;
  const ac = context();
  return ac ? { ac, out: musicGain! } : null;
}

/** The music bus if audio has already started, whatever the preference (used to fade out). */
export function existingMusicBus(): Bus | null {
  return ctx && musicGain ? { ac: ctx, out: musicGain } : null;
}

/** For tests: forget the audio graph so a fresh fake AudioContext can be used. */
export function resetAudioForTests() {
  ctx = null;
  sfxGain = null;
  musicGain = null;
}
