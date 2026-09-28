/**
 * Checks the REAL committed draw without ever revealing it.
 * Every assertion goes through assertSecret, which fails with a label only.
 */
import { describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drawSalt, encodedDraw } from "@data/assignments";
import { exclusions } from "../src/data/rules";
import { PERSON_IDS } from "../src/data/people";
import { validateDraw } from "../src/lib/draw";
import { decodeReceiver } from "../src/lib/secretCodec";
import { assertSecret } from "./helpers/assertSecret";

const ids = [...PERSON_IDS];
const decoded = () =>
  Object.fromEntries(Object.entries(encodedDraw).map(([g, enc]) => [g, decodeReceiver(drawSalt, g, enc)]));

describe("the real committed draw (results hidden)", () => {
  it("has exactly one entry for each of the 10 cousins", () => {
    const givers = Object.keys(encodedDraw);
    assertSecret(givers.length === 10, "draw does not have 10 givers");
    assertSecret(ids.every((id) => givers.includes(id)), "draw is missing a cousin, run `npm run draw -- --force`");
  });

  it("decodes to known cousins only", () => {
    assertSecret(Object.values(decoded()).every((r) => ids.includes(r as never)), "draw decodes to an unknown id");
  });

  it("passes every rule: no self-draws, no repeats, no excluded pairs, one single loop", () => {
    const { ok, errors } = validateDraw(decoded(), ids, exclusions);
    // errors are rule labels only (never names), so they're safe to show
    assertSecret(ok, `draw is invalid: ${errors.join(", ")}. Run \`npm run draw -- --force\``);
  });

  it("stores no readable names in the draw file", () => {
    const source = readFileSync(resolve(process.cwd(), "src/data/assignments.ts"), "utf8");
    const values = [...source.matchAll(/:\s*"([^"]*)"/g)].map((m) => m[1]!);
    assertSecret(values.length >= 10, "could not read the draw file");
    assertSecret(
      values.every((v) => ids.every((id) => !v.includes(id))),
      "the draw file contains a readable name",
    );
  });
});
