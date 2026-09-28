import { describe, expect, it } from "vitest";
import { PERSON_IDS } from "../src/data/people";
import { ENCODED_WIDTH, decodeReceiver, encodeReceiver, randomSalt } from "../src/lib/secretCodec";

const SALT = "test-salt-1234";

describe("secret codec (scrambles receivers so the host can't read the draw)", () => {
  it("round-trips every id for every giver", () => {
    for (const g of PERSON_IDS)
      for (const r of PERSON_IDS) expect(decodeReceiver(SALT, g, encodeReceiver(SALT, g, r))).toBe(r);
  });

  it("never contains the plain receiver id", () => {
    for (const g of PERSON_IDS)
      for (const r of PERSON_IDS) expect(encodeReceiver(SALT, g, r).includes(r)).toBe(false);
  });

  it("produces the same length for every receiver, so name length can't give it away", () => {
    const lengths = new Set(PERSON_IDS.map((r) => encodeReceiver(SALT, "devern", r).length));
    expect(lengths.size).toBe(1);
  });

  it("encodes the same receiver differently for different givers and salts", () => {
    const a = encodeReceiver(SALT, "devern", "dana");
    expect(encodeReceiver(SALT, "feisha", "dana")).not.toBe(a);
    expect(encodeReceiver("other-salt", "devern", "dana")).not.toBe(a);
  });

  it("does not decode to the original with the wrong giver or salt", () => {
    const enc = encodeReceiver(SALT, "devern", "dana");
    expect(decodeReceiver(SALT, "feisha", enc)).not.toBe("dana");
    expect(decodeReceiver("other-salt", "devern", enc)).not.toBe("dana");
  });

  it("rejects receiver ids longer than the fixed width", () => {
    expect(() => encodeReceiver(SALT, "devern", "x".repeat(ENCODED_WIDTH + 1))).toThrow(RangeError);
  });

  it("makes a fresh random salt each time", () => {
    const s1 = randomSalt();
    expect(s1).toMatch(/^[0-9a-f]{32}$/);
    expect(randomSalt()).not.toBe(s1);
  });
});
