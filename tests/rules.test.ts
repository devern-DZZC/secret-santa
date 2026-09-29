import { describe, expect, it } from "vitest";
import { exclusions } from "../src/data/rules";
import { PERSON_IDS, people } from "../src/data/people";

const SPEC_PAIRS = [
  ["devern", "feisha"],
  ["eeshana", "nathan"],
  ["nirvana", "chris-alexander"],
  ["chris-ali", "reyan"],
  ["brandon", "chris-ali"],
  ["brandon", "dana"],
  ["chris-ali", "dana"],
  ["devern", "nirvana"],
] as const;

const norm = (a: string, b: string) => [a, b].sort().join("|");

describe("exclusion rules data", () => {
  it("contains exactly the 8 pairs from the spec (any order, either orientation)", () => {
    expect(exclusions).toHaveLength(8);
    expect(new Set(exclusions.map(([a, b]) => norm(a, b)))).toEqual(
      new Set(SPEC_PAIRS.map(([a, b]) => norm(a, b))),
    );
  });

  it("only uses ids that exist in people", () => {
    for (const [a, b] of exclusions) {
      expect(PERSON_IDS).toContain(a);
      expect(PERSON_IDS).toContain(b);
    }
  });

  it("has no self-pairs and no duplicates", () => {
    for (const [a, b] of exclusions) expect(a).not.toBe(b);
    expect(new Set(exclusions.map(([a, b]) => norm(a, b))).size).toBe(exclusions.length);
  });
});

describe("people data", () => {
  it("has the 10 cousins in the expected order", () => {
    expect(people.map((p) => p.id)).toEqual([
      "devern", "feisha", "eeshana", "nathan", "nirvana",
      "chris-ali", "chris-alexander", "brandon", "dana", "reyan",
    ]);
  });

  it("gives everyone a name, short name, emoji and exactly 3 gift ideas", () => {
    for (const p of people) {
      expect(p.name.trim()).not.toBe("");
      expect(p.shortName.trim()).not.toBe("");
      expect(p.emoji.trim()).not.toBe("");
      expect(p.wishlist).toHaveLength(3);
      for (const g of p.wishlist) expect(g.idea.trim()).not.toBe("");
    }
  });

  it("uses the fixed PINs agreed with the host", () => {
    const pins = Object.fromEntries(people.map((p) => [p.id, p.pin]));
    expect(pins).toEqual({
      devern: "2004", feisha: "2356", eeshana: "3817", nathan: "4702", nirvana: "5169",
      "chris-ali": "6431", "chris-alexander": "7258", brandon: "8093", dana: "0946", reyan: "1587",
    });
  });
});
