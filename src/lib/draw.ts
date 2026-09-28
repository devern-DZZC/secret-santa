/**
 * Secret Santa draw engine.
 *
 * generateDraw builds one big gift loop (A → B → C → … → A) with Sattolo's
 * algorithm, then rejects and retries any loop that breaks an exclusion rule.
 * Error messages name rules and problems, never people, so they're safe to
 * show while the draw stays secret.
 */

export type Draw = Record<string, string>;
export type Exclusions = ReadonlyArray<readonly [string, string]>;

export interface ValidateOptions {
  /** Require one loop through everyone (default true). */
  requireSingleCycle?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export const MAX_ATTEMPTS = 10_000;

export class DrawImpossibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrawImpossibleError";
  }
}

/** Precomputes lookups once, then validates many draws quickly. */
export function createValidator(
  ids: readonly string[],
  exclusions: Exclusions,
  { requireSingleCycle = true }: ValidateOptions = {},
): (draw: Readonly<Draw>) => ValidationResult {
  const known = new Set(ids);
  const ruleFor = new Map<string, string>();
  exclusions.forEach(([a, b], i) => {
    ruleFor.set(`${a}>${b}`, `R${i + 1}`);
    ruleFor.set(`${b}>${a}`, `R${i + 1}`);
  });

  return (draw) => {
    const errors = new Set<string>();
    const receivers = new Set<string>();

    for (const id of ids) if (!(id in draw)) errors.add("missing giver");

    for (const [giver, receiver] of Object.entries(draw)) {
      if (!known.has(giver) || !known.has(receiver)) {
        errors.add("unknown id");
        continue;
      }
      if (giver === receiver) errors.add("self-assignment");
      if (receivers.has(receiver)) errors.add("duplicate receiver");
      receivers.add(receiver);
      const rule = ruleFor.get(`${giver}>${receiver}`);
      if (rule) errors.add(`rule ${rule} violated`);
    }

    if (errors.size === 0 && requireSingleCycle) {
      let steps = 0;
      let current = ids[0]!;
      do {
        current = draw[current]!;
        steps++;
      } while (current !== ids[0]);
      if (steps !== ids.length) errors.add("not a single cycle");
    }

    return { ok: errors.size === 0, errors: [...errors] };
  };
}

export function validateDraw(
  draw: Readonly<Draw>,
  ids: readonly string[],
  exclusions: Exclusions,
  options?: ValidateOptions,
): ValidationResult {
  return createValidator(ids, exclusions, options)(draw);
}

/** Sattolo's algorithm: a uniformly random single-cycle permutation of 0..n-1. */
function sattolo(n: number, rng: () => number): number[] {
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * i);
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  return p;
}

export function generateDraw(
  ids: readonly string[],
  exclusions: Exclusions,
  rng: () => number = Math.random,
): Draw {
  if (ids.length < 2) throw new DrawImpossibleError("A draw needs at least 2 people.");
  const isValid = createValidator(ids, exclusions);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const p = sattolo(ids.length, rng);
    const draw: Draw = {};
    ids.forEach((id, i) => (draw[id] = ids[p[i]!]!));
    if (isValid(draw).ok) return draw;
  }
  throw new DrawImpossibleError(
    `No valid draw found after ${MAX_ATTEMPTS.toLocaleString("en")} tries. The rules may be impossible to satisfy.`,
  );
}
