import { describe, expect, it } from "vitest";
import { getReceiverId } from "../src/lib/drawStore";
import { PERSON_IDS } from "../src/data/people";
import { assertSecret } from "./helpers/assertSecret";

describe("drawStore", () => {
  it("returns nothing for someone who isn't in the draw", () => {
    expect(getReceiverId("santa")).toBeUndefined();
  });

  it("returns a real cousin for everyone in the draw (checked without revealing)", () => {
    for (const id of PERSON_IDS) {
      const r = getReceiverId(id);
      assertSecret(r !== undefined && (PERSON_IDS as readonly string[]).includes(r), "draw entry is not a cousin");
    }
  });
});
