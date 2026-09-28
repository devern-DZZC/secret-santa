import { describe, expect, it } from "vitest";
import { parseHash, toHash } from "../../src/ui/router";

describe("hash router", () => {
  it.each([
    ["", { name: "home" }],
    ["#/", { name: "home" }],
    ["#/who", { name: "who" }],
    ["#/pin/dana", { name: "pin", id: "dana" }],
    ["#/giftee/chris-ali", { name: "giftee", id: "chris-ali" }],
    ["#/pin/santa", { name: "who" }],
    ["#/giftee/", { name: "who" }],
    ["#/nonsense", { name: "home" }],
  ])("parses %j", (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });

  it("round-trips every route", () => {
    for (const r of [
      { name: "home" },
      { name: "who" },
      { name: "pin", id: "reyan" },
      { name: "giftee", id: "chris-alexander" },
    ] as const) {
      expect(parseHash(toHash(r))).toEqual(r);
    }
  });
});
