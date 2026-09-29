/** A tiny stand-in for the Web Audio API so sound and music code can be tested in jsdom. */
export function installFakeAudio() {
  const stats = { contexts: 0, oscillators: 0, gainMoves: 0, ctx: null as null | { currentTime: number } };
  const param = () => ({
    value: 1,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    cancelScheduledValues() {},
    setTargetAtTime() {
      stats.gainMoves++;
    },
  });
  const node = () => ({ connect: (n: unknown) => n ?? node(), gain: param() });
  class FakeContext {
    currentTime = 0;
    state = "running";
    destination = node();
    constructor() {
      stats.contexts++;
      stats.ctx = this;
    }
    createGain = node;
    createDynamicsCompressor = node;
    createOscillator() {
      stats.oscillators++;
      return { ...node(), type: "sine", frequency: { setValueAtTime() {} }, start() {}, stop() {} };
    }
    resume() {
      return Promise.resolve();
    }
  }
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
  return stats;
}

export function removeFakeAudio() {
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
}
