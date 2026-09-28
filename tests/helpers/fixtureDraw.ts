/**
 * A public, known-valid draw used only as a test fixture (never the real draw).
 * devern → eeshana → feisha → nathan → nirvana → brandon → reyan → dana
 *   → chris-alexander → chris-ali → devern
 */
export const FIXTURE_DRAW: Readonly<Record<string, string>> = Object.freeze({
  devern: "eeshana",
  eeshana: "feisha",
  feisha: "nathan",
  nathan: "nirvana",
  nirvana: "brandon",
  brandon: "reyan",
  reyan: "dana",
  dana: "chris-alexander",
  "chris-alexander": "chris-ali",
  "chris-ali": "devern",
});

/** Force `giver → receiver` into a copy of `draw`, keeping it a permutation. */
export function withForcedPair(
  draw: Readonly<Record<string, string>>,
  giver: string,
  receiver: string,
): Record<string, string> {
  const next = { ...draw };
  const previousGiver = Object.keys(next).find((g) => next[g] === receiver)!;
  next[previousGiver] = next[giver]!;
  next[giver] = receiver;
  return next;
}
