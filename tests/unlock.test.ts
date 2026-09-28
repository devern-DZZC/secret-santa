import { describe, expect, it } from "vitest";
import { drawSalt, encodedDraw } from "@data/assignments";
import { people } from "../src/data/people";
import { PIN_PATTERN, TRIVIAL_PINS, unlock } from "../src/lib/unlock";
import { decodeReceiver } from "../src/lib/secretCodec";
import { assertSecret } from "./helpers/assertSecret";

const expectedReceiverId = (giverId: string) => decodeReceiver(drawSalt, giverId, encodedDraw[giverId]!);

describe("PIN data", () => {
  it("every PIN is a 4-digit string", () => {
    for (const p of people) {
      expect(typeof p.pin).toBe("string");
      expect(p.pin).toMatch(PIN_PATTERN);
    }
  });

  it("every PIN is unique", () => {
    expect(new Set(people.map((p) => p.pin)).size).toBe(people.length);
  });

  it("no PIN is trivial to guess", () => {
    for (const p of people) expect(TRIVIAL_PINS).not.toContain(p.pin);
  });
});

describe("PIN matrix: every person × every PIN (100 combinations)", () => {
  const cases = people.flatMap((giver) => people.map((owner) => [giver.id, owner.id, owner.pin] as const));

  it("covers all 100", () => expect(cases).toHaveLength(100));

  describe.each(people.map((p) => [p.id, p.pin] as const))("%s with their own PIN", (id, pin) => {
    it("unlocks and returns exactly their own giftee (checked without revealing it)", () => {
      const result = unlock(id, pin);
      assertSecret(result !== null, "correct PIN did not unlock");
      assertSecret(result.giver.id === id, "unlocked the wrong giver");
      assertSecret(result.receiver.id === expectedReceiverId(id), "returned the wrong giftee");
      const giftee = people.find((p) => p.id === result.receiver.id)!;
      assertSecret(
        JSON.stringify(result.receiver.wishlist) === JSON.stringify(giftee.wishlist),
        "returned the wrong wishlist",
      );
    });
  });

  const mismatched = cases.filter(([giverId, ownerId]) => giverId !== ownerId);
  it("has 90 mismatched combinations", () => expect(mismatched).toHaveLength(90));

  it.each(mismatched)("%s cannot be unlocked with %s's PIN", (giverId, _owner, pin) => {
    expect(unlock(giverId, pin)).toBeNull();
  });
});

describe("bad input is always denied", () => {
  const devern = people.find((p) => p.id === "devern")!;
  const dana = people.find((p) => p.id === "dana")!; // PIN has a leading zero

  it.each([
    ["empty", ""],
    ["3 digits", "123"],
    ["5 digits", "12345"],
    ["letters", "abcd"],
    ["mixed", "12a4"],
    ["leading space", ` ${devern.pin}`],
    ["trailing space", `${devern.pin} `],
    ["5 digits starting with the real PIN", `${devern.pin}0`],
    ["null", null],
    ["undefined", undefined],
    ["a number", Number(devern.pin)],
  ])("rejects %s", (_label, pin) => {
    expect(unlock("devern", pin)).toBeNull();
  });

  it("rejects a leading-zero PIN given as a number", () => {
    expect(dana.pin.startsWith("0")).toBe(true);
    expect(unlock("dana", Number(dana.pin))).toBeNull();
    expect(unlock("dana", dana.pin)).not.toBeNull();
  });

  it.each([["santa"], [""], ["Devern"], [null], [undefined], [42]])("rejects unknown person %s", (id) => {
    expect(unlock(id, devern.pin)).toBeNull();
  });
});

describe("unlock never leaks more than it should", () => {
  it("returns only the giver and their one giftee, with no PINs anywhere", () => {
    for (const p of people) {
      // assertSecret only: a failure here must never print the real giftee
      const result = unlock(p.id, p.pin)!;
      assertSecret(Object.keys(result).sort().join() === "giver,receiver", "unlock result has extra keys");
      const json = JSON.stringify(result);
      assertSecret(!json.includes('"pin"'), "unlock result includes a pin field");
      assertSecret(people.every((o) => !json.includes(`"${o.pin}"`)), "unlock result includes a PIN");
      assertSecret(!json.includes("assignments") && !json.includes("encoded"), "unlock result leaks the draw");
    }
  });
});
