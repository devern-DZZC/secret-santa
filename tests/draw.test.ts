import { beforeAll, describe, expect, it } from "vitest";
import { exclusions } from "../src/data/rules";
import { PERSON_IDS } from "../src/data/people";
import {
  DrawImpossibleError,
  MAX_ATTEMPTS,
  createValidator,
  generateDraw,
  validateDraw,
} from "../src/lib/draw";
import { mulberry32 } from "../src/lib/rng";
import { forEachPermutation } from "./helpers/permutations";
import { FIXTURE_DRAW } from "./helpers/fixtureDraw";

const ids = [...PERSON_IDS];

function cycleLength(draw: Record<string, string>, start: string): number {
  let n = 0;
  let cur = start;
  do {
    cur = draw[cur]!;
    n++;
  } while (cur !== start && n <= ids.length);
  return n;
}

describe("generateDraw: 100,000 random draws", () => {
  it("every draw is a valid single loop that respects every rule", () => {
    const rng = mulberry32(42);
    for (let run = 0; run < 100_000; run++) {
      const draw = generateDraw(ids, exclusions, rng);
      const givers = Object.keys(draw);
      const receivers = Object.values(draw);
      // everyone gives exactly once
      expect(givers.length).toBe(10);
      expect(new Set(givers)).toEqual(new Set(ids));
      // everyone receives exactly once
      expect(new Set(receivers).size).toBe(10);
      expect(new Set(receivers)).toEqual(new Set(ids));
      // nobody draws themselves
      for (const g of givers) expect(draw[g]).not.toBe(g);
      // no excluded pair either way
      for (const [a, b] of exclusions) {
        expect(draw[a]).not.toBe(b);
        expect(draw[b]).not.toBe(a);
      }
      // one single loop through all 10
      expect(cycleLength(draw, ids[0]!)).toBe(10);
    }
  });

  it("is deterministic for a given seed", () => {
    expect(generateDraw(ids, exclusions, mulberry32(7))).toEqual(
      generateDraw(ids, exclusions, mulberry32(7)),
    );
    expect(generateDraw(ids, exclusions, mulberry32(7))).not.toEqual(
      generateDraw(ids, exclusions, mulberry32(8)),
    );
  });

  it("uses Math.random when no rng is given", () => {
    expect(validateDraw(generateDraw(ids, exclusions), ids, exclusions).ok).toBe(true);
  });
});

describe("exhaustive cross-check of all 10! = 3,628,800 assignments", () => {
  let valid = 0;
  let validSingleLoop = 0;
  const loopPairCounts = new Map<string, number>();

  beforeAll(() => {
    const loose = createValidator(ids, exclusions, { requireSingleCycle: false });
    const strict = createValidator(ids, exclusions);
    const draw: Record<string, string> = {};
    forEachPermutation(10, (p) => {
      for (let i = 0; i < 10; i++) draw[ids[i]!] = ids[p[i]!]!;
      if (!loose(draw).ok) return;
      valid++;
      if (!strict(draw).ok) return;
      validSingleLoop++;
      for (const g of ids) {
        const k = `${g}>${draw[g]}`;
        loopPairCounts.set(k, (loopPairCounts.get(k) ?? 0) + 1);
      }
    });
  }, 180_000);

  it("accepts exactly 244,800 draws when single loops are not required", () => {
    expect(valid).toBe(244_800);
  });

  it("accepts exactly 60,192 draws when a single loop is required", () => {
    expect(validSingleLoop).toBe(60_192);
  });

  it("gives each giver the expected number of allowed receivers", () => {
    const optionsFor = (g: string) => ids.filter((r) => (loopPairCounts.get(`${g}>${r}`) ?? 0) > 0).length;
    expect(optionsFor("chris-ali")).toBe(6);
    expect(optionsFor("brandon")).toBe(7);
    expect(optionsFor("dana")).toBe(7);
    for (const g of ["devern", "feisha", "eeshana", "nathan", "nirvana", "chris-alexander", "reyan"]) {
      expect(optionsFor(g)).toBe(8);
    }
  });

  it("is fair: every allowed pairing shows up within ±10% of its exact expected share", () => {
    const RUNS = 100_000;
    const rng = mulberry32(1227);
    const seen = new Map<string, number>();
    for (let run = 0; run < RUNS; run++) {
      const draw = generateDraw(ids, exclusions, rng);
      for (const g of ids) {
        const k = `${g}>${draw[g]}`;
        seen.set(k, (seen.get(k) ?? 0) + 1);
      }
    }
    for (const [pair, count] of loopPairCounts) {
      const expected = (count / 60_192) * RUNS;
      const actual = seen.get(pair) ?? 0;
      expect(actual, `pairing ${pair} appeared at least once`).toBeGreaterThan(0);
      expect(Math.abs(actual - expected) / expected, `pairing ${pair} within 10%`).toBeLessThan(0.1);
    }
    // and nothing outside the allowed set ever appears
    for (const pair of seen.keys()) expect(loopPairCounts.has(pair)).toBe(true);
  });
});

describe("impossible and edge cases", () => {
  it("throws DrawImpossibleError quickly when the rules can't be satisfied", () => {
    const everyoneExcludedFromDevern = ids.filter((i) => i !== "devern").map((i) => ["devern", i] as const);
    const start = performance.now();
    expect(() => generateDraw(ids, everyoneExcludedFromDevern, mulberry32(1))).toThrow(DrawImpossibleError);
    expect(performance.now() - start).toBeLessThan(1000);
    expect(MAX_ATTEMPTS).toBe(10_000);
  });

  it("throws DrawImpossibleError for fewer than 2 people", () => {
    expect(() => generateDraw(["solo"], [])).toThrow(DrawImpossibleError);
    expect(() => generateDraw([], [])).toThrow(DrawImpossibleError);
  });

  it("a group of 2 swaps with each other", () => {
    expect(generateDraw(["a", "b"], [], mulberry32(3))).toEqual({ a: "b", b: "a" });
  });

  it("a group of 3 always forms one 3-person loop", () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 1000; i++) {
      const d = generateDraw(["a", "b", "c"], [], rng);
      expect(d[d[d.a!]!]).toBe("a");
      expect(new Set(Object.values(d)).size).toBe(3);
    }
  });
});

describe("validateDraw error reporting", () => {
  const base = { ...FIXTURE_DRAW };

  it("reports a missing giver", () => {
    const { devern: _omit, ...rest } = base;
    expect(validateDraw(rest, ids, exclusions).errors).toContain("missing giver");
  });

  it("reports unknown ids as giver or receiver", () => {
    expect(validateDraw({ ...base, santa: "devern" }, ids, exclusions).errors).toContain("unknown id");
    expect(validateDraw({ ...base, devern: "santa" }, ids, exclusions).errors).toContain("unknown id");
  });

  it("reports a duplicate receiver", () => {
    expect(validateDraw({ ...base, devern: base.eeshana! }, ids, exclusions).errors).toContain(
      "duplicate receiver",
    );
  });

  it("reports two separate loops as not a single loop, unless loops are allowed", () => {
    // Two valid 5-person loops: no self-draws, no excluded pairs, but not one big loop.
    const twoLoops: Record<string, string> = {
      devern: "eeshana", eeshana: "chris-ali", "chris-ali": "feisha", feisha: "nirvana", nirvana: "devern",
      nathan: "brandon", brandon: "reyan", reyan: "dana", dana: "chris-alexander", "chris-alexander": "nathan",
    };
    expect(validateDraw(twoLoops, ids, exclusions)).toEqual({ ok: false, errors: ["not a single cycle"] });
    expect(validateDraw(twoLoops, ids, exclusions, { requireSingleCycle: false })).toEqual({ ok: true, errors: [] });
  });

  it("never mentions a person's id in any error message", () => {
    const messy = { ...base, devern: "devern", santa: "dana" };
    for (const e of validateDraw(messy, ids, exclusions).errors) {
      for (const id of ids) expect(e.includes(id)).toBe(false);
    }
  });
});
