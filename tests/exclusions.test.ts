import { beforeAll, describe, expect, it } from "vitest";
import { exclusions } from "../src/data/rules";
import { PERSON_IDS } from "../src/data/people";
import { generateDraw, validateDraw } from "../src/lib/draw";
import { mulberry32 } from "../src/lib/rng";
import { FIXTURE_DRAW, withForcedPair } from "./helpers/fixtureDraw";

const ids = [...PERSON_IDS];
const RUNS = 100_000;

// Every forbidden directed assignment, with the rule it belongs to.
const FORBIDDEN: Array<[rule: string, giver: string, receiver: string]> = exclusions.flatMap(
  ([a, b], i) => [
    [`R${i + 1}`, a, b],
    [`R${i + 1}`, b, a],
  ],
);

const pairCounts = new Map<string, number>();

beforeAll(() => {
  const rng = mulberry32(20261227);
  for (let run = 0; run < RUNS; run++) {
    const draw = generateDraw(ids, exclusions, rng);
    for (const g of ids) {
      const key = `${g}>${draw[g]}`;
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    }
  }
});

describe("the public fixture draw", () => {
  it("is valid, so it can be used as a baseline", () => {
    expect(validateDraw(FIXTURE_DRAW, ids, exclusions)).toEqual({ ok: true, errors: [] });
  });
});

describe("each forbidden assignment (16 directed pairs)", () => {
  it("covers all 16", () => expect(FORBIDDEN).toHaveLength(16));

  it("includes the Devern and Nirvana rule (R8) in both directions", () => {
    expect(FORBIDDEN).toContainEqual(["R8", "devern", "nirvana"]);
    expect(FORBIDDEN).toContainEqual(["R8", "nirvana", "devern"]);
  });

  describe.each(FORBIDDEN)("%s: %s must never draw %s", (rule, giver, receiver) => {
    it("is rejected by the validator", () => {
      const result = validateDraw(withForcedPair(FIXTURE_DRAW, giver, receiver), ids, exclusions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain(`rule ${rule} violated`);
    });

    it(`never appears in ${RUNS.toLocaleString("en")} generated draws`, () => {
      expect(pairCounts.get(`${giver}>${receiver}`) ?? 0).toBe(0);
    });
  });
});

describe("self-draws (10 people)", () => {
  describe.each(ids)("%s", (id) => {
    it("drawing themselves is rejected by the validator", () => {
      const draw = { ...FIXTURE_DRAW, [id]: id };
      const result = validateDraw(draw, ids, exclusions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain("self-assignment");
    });

    it(`never draws themselves in ${RUNS.toLocaleString("en")} generated draws`, () => {
      expect(pairCounts.get(`${id}>${id}`) ?? 0).toBe(0);
    });
  });
});
